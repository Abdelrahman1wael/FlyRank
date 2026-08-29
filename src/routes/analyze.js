import express from "express";
import { InputSchema, stubOutput } from "../llm/schema.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { JobCardOutputSchema, stubResponse } from "../llm/schema.js";
const router = express.Router();

router.post("/analyze", (req, res) => {
  // 1. Input validation
  const validation = InputSchema.safeParse(req.body);
  if (!validation.success) {
    const errorDetails = validation.error.issues[0];
    return res.status(400).json({
      error: "Validation Failed",
      field: errorDetails.path.join("."),
      message: errorDetails.message,
    });
  }

  // 2. Stub-mode conditional override
  if (process.env.LLM_STUB === "1") {
    return res.status(200).json(stubOutput);
  }

  // 3. Real LLM pipeline placeholder (built in Stage 2+)
  return res.status(501).json({
    message: "LLM processing pipeline is not implemented yet.",
  });
});


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RequestInputSchema = z.object({
  rawText: z.string({ required_error: "rawText is required" }).max(5000),
  userId: z.string({ required_error: "userId is required" }),
});

async function getSystemPrompt() {
  const promptPath = path.join(__dirname, "../../prompts/job-classifier-v1.md");
  return fs.promises.readFile(promptPath, "utf-8");
}

router.post("/your-thing", async (expressReq, expressRes) => {
  try {
    // 1. Validate input
    const validatedInput = RequestInputSchema.parse(expressReq.body);

    // 2. Short-circuit on stub mode
    if (process.env.LLM_STUB === "1") {
      return expressRes.status(200).json(stubResponse);
    }

    // 3. Load the versioned system prompt from the filesystem
    const systemPrompt = await getSystemPrompt();

    // 4. Isolate untrusted content: JSON-encode it inside a dedicated user message
    //    so the model parses it strictly as data, never as instructions.
    const sanitizedUserPayload = JSON.stringify({ content: validatedInput.rawText });

    // 5. Call OpenRouter (low temperature for deterministic structure)
    const openRouterResponse = await fetch("https://openrouter.ai", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "SaaS Classifier System",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sanitizedUserPayload },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      return expressRes.status(502).json({ error: "OpenRouter failure", detail: errText });
    }

    const completionData = await openRouterResponse.json();
    let rawTextAnswer = completionData.choices[0].message.content.trim();

    // Strip accidental markdown code fences if the model ignores instructions
    if (rawTextAnswer.startsWith("```json")) {
      rawTextAnswer = rawTextAnswer.replace(/^```json\s*/, "").replace(/```\s*$/, "");
    }

    // 6. Validate the model's response against the same schema contract
    const structuredJsonOutput = JSON.parse(rawTextAnswer);
    const finalizedOutput = JobCardOutputSchema.parse(structuredJsonOutput);

    return expressRes.status(200).json(finalizedOutput);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return expressRes.status(400).json({ error: "Validation Failed" });
    }
    if (error instanceof SyntaxError) {
      return expressRes.status(502).json({ error: "Model failed to output valid JSON" });
    }
    return expressRes.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;