import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { InputSchema, OutputSchema, stubOutput, JobCardOutputSchema, stubResponse } from "../llm/schema.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_VERSION = "job-classifier-v1";

const RequestInputSchema = z.object({
  rawText: z.string({ required_error: "rawText is required" }).min(1, "rawText cannot be empty").max(5000),
  userId: z.string({ required_error: "userId is required" }),
});

async function getSystemPrompt() {
  const promptPath = path.join(__dirname, "../../prompts/job-classifier-v1.md");
  return fs.promises.readFile(promptPath, "utf-8");
}

function cleanAndParseJSON(rawText) {
  let cleanText = rawText.trim();
  if (cleanText.includes("```")) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) cleanText = match[1].trim();
  }
  return JSON.parse(cleanText);
}

async function quarantineFailure(inputData, rawModelOutput, errorDetails) {
  try {
    const logsDir = path.join(__dirname, "../../logs");
    await fs.promises.mkdir(logsDir, { recursive: true });
    const quarantinePath = path.join(logsDir, "quarantine.jsonl");
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      promptVersion: PROMPT_VERSION,
      input: inputData,
      rawOutput: rawModelOutput,
      error: errorDetails,
    });
    await fs.promises.appendFile(quarantinePath, logEntry + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to log to quarantine:", err.message);
  }
}

async function logMetrics(metricsData) {
  try {
    const logsDir = path.join(__dirname, "../../logs");
    await fs.promises.mkdir(logsDir, { recursive: true });
    const metricsPath = path.join(logsDir, "metrics.jsonl");
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      promptVersion: PROMPT_VERSION,
      ...metricsData,
    });
    await fs.promises.appendFile(metricsPath, logEntry + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to log metrics:", err.message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModelWithRetry(systemPrompt, userPayload, messagesHistory = [], maxRetries = 3) {
  const modelName = process.env.LLM_MODEL || "google/gemini-2.5-flash";
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1";
  const apiUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify({ content: userPayload }) },
    ...messagesHistory,
  ];

  let attempt = 0;
  while (attempt <= maxRetries) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3005",
          "X-Title": "SaaS Hardened Classifier",
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.1,
          max_tokens: 500,
          messages,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const durationMs = Date.now() - startTime;
        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
        return {
          content: data.choices[0].message.content,
          metrics: {
            model: modelName,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            durationMs,
          },
        };
      }

      if ([400, 401, 403].includes(response.status)) {
        const errText = await response.text();
        const error = new Error(`Fatal API Client Error (${response.status}): ${errText}`);
        error.status = response.status;
        throw error;
      }

      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        attempt++;
        if (attempt > maxRetries) throw new Error(`Upstream API failed after retries: ${response.status}`);
        const retryAfterHeader = response.headers.get("retry-after");
        let delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 300;
        if (retryAfterHeader && !isNaN(parseInt(retryAfterHeader, 10))) {
          delayMs = parseInt(retryAfterHeader, 10) * 1000;
        }
        await sleep(delayMs);
        continue;
      }
      throw new Error(`Uncategorized API response: ${response.status}`);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.status) throw err;
      if (err.name === "AbortError") {
        attempt++;
        if (attempt > maxRetries) {
          const e = new Error("Gateway connection target exceeded timeout");
          e.status = 504;
          throw e;
        }
        await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 300);
        continue;
      }
      attempt++;
      if (attempt > maxRetries) throw err;
      await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 300);
    }
  }
}

async function handleClassificationRequest(expressReq, expressRes) {
  try {
    // 1. Kill Switch Check
    if (process.env.LLM_ENABLED === "false") {
      return expressRes.status(503).json({ error: "Service Temporarily Unavailable" });
    }

    // 2. Validate input
    const validation = RequestInputSchema.safeParse(expressReq.body);
    if (!validation.success) {
      const errorDetails = validation.error.issues[0];
      return expressRes.status(400).json({
        error: "Validation Failed",
        field: errorDetails.path.join("."),
        message: errorDetails.message,
      });
    }
    const validatedInput = validation.data;

    // 3. Short-circuit on stub mode
    if (process.env.LLM_STUB === "1") {
      return expressRes.status(200).json(stubResponse);
    }

    // 4. System prompt
    const systemPrompt = await getSystemPrompt();

    // 5. Attempt 1 call
    const call1Result = await callModelWithRetry(systemPrompt, validatedInput.rawText, []);
    let rawContent = call1Result.content;
    let accumulatedMetrics = { ...call1Result.metrics, repaired: false };

    let parsedOutput;
    try {
      parsedOutput = cleanAndParseJSON(rawContent);
      const finalizedOutput = JobCardOutputSchema.parse(parsedOutput);
      await logMetrics(accumulatedMetrics);
      return expressRes.status(200).json(finalizedOutput);
    } catch (parseOrValidationError) {
      // Attempt 2: Bounded Repair Loop (Retry Once)
      const repairMessages = [
        { role: "assistant", content: rawContent },
        {
          role: "user",
          content: `Your previous JSON output was invalid. Error: ${parseOrValidationError.message}. Please output ONLY a valid JSON object matching the required schema without markdown wrappers.`,
        },
      ];

      try {
        const call2Result = await callModelWithRetry(systemPrompt, validatedInput.rawText, repairMessages);
        rawContent = call2Result.content;
        accumulatedMetrics.promptTokens += call2Result.metrics.promptTokens;
        accumulatedMetrics.completionTokens += call2Result.metrics.completionTokens;
        accumulatedMetrics.durationMs += call2Result.metrics.durationMs;
        accumulatedMetrics.repaired = true;

        parsedOutput = cleanAndParseJSON(rawContent);
        const finalizedOutput = JobCardOutputSchema.parse(parsedOutput);
        await logMetrics(accumulatedMetrics);
        return expressRes.status(200).json(finalizedOutput);
      } catch (repairError) {
        // Demarcation: Quarantine on persistent failure
        await quarantineFailure(validatedInput, rawContent, repairError.message);
        await logMetrics({ ...accumulatedMetrics, failed: true });
        return expressRes.status(422).json({
          error: "Unprocessable Entity",
          message: "Model response failed validation after repair attempt.",
        });
      }
    }
  } catch (error) {
    if (error.status) {
      return expressRes.status(error.status).json({ error: error.message });
    }
    return expressRes.status(500).json({ error: "Internal Server Error", detail: error.message });
  }
}

// Support both endpoint paths
router.post("/analyze", handleClassificationRequest);
router.post("/your-thing", handleClassificationRequest);

export default router;