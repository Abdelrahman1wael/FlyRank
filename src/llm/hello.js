import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

async function main() {
  try {
    const res = await client.chat.completions.create({
      model: process.env.LLM_MODEL,
      messages: [{ role: "user", content: "Reply with exactly the word: ready" }],
    });
    console.log(res.choices[0].message.content.trim());
  } catch (error) {
    console.error("Error connecting to the LLM provider:", error.message);
  }
}

async function callModelWithRetry(systemPrompt, userPayload, messagesHistory = [], maxRetries = 3) {
  const modelName = "google/gemini-2.5-flash";
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify({ content: userPayload }) },
    ...messagesHistory,
  ];

  let attempt = 0;
  while (attempt <= maxRetries) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // strict 30s timeout

    try {
      const response = await fetch("https://openrouter.ai", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SaaS Hardened Classifier",
        },
        body: JSON.stringify({ model: modelName, temperature: 0.1, messages }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const durationMs = Date.now() - startTime;
        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
        return {
          content: data.choices[0].message.content,
          metrics: { model: modelName, promptTokens: usage.prompt_tokens,
                     completionTokens: usage.completion_tokens, durationMs },
        };
      }

      // Client/auth errors — NEVER retried
      if ([400, 401, 403].includes(response.status)) {
        const errText = await response.text();
        const error = new Error(`Fatal API Client Error (${response.status}): ${errText}`);
        error.status = response.status;
        throw error;
      }

      // Server overload / rate limit — eligible for backoff retry
      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        attempt++;
        if (attempt > maxRetries) throw new Error("Upstream system exhausted available processing attempts.");
        const retryAfterHeader = response.headers.get("retry-after");
        let delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 300; // exponential backoff + jitter
        if (retryAfterHeader && !isNaN(parseInt(retryAfterHeader, 10))) {
          delayMs = parseInt(retryAfterHeader, 10) * 1000;
        }
        await sleep(delayMs);
        continue;
      }
      throw new Error(`Uncategorized API response: ${response.status}`);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.status) throw err;                 // non-retryable — bubble up immediately
      if (err.name === "AbortError") {            // timeout
        attempt++;
        if (attempt > maxRetries) { const e = new Error("Gateway connection target exceeded"); e.status = 504; throw e; }
        await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 300);
        continue;
      }
      attempt++;                                  // generic network drop-out
      if (attempt > maxRetries) throw err;
      await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 300);
    }
  }
}


main();