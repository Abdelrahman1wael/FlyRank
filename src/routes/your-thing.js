// Clean + parse: strips code fences, then JSON.parse
function cleanAndParseJSON(rawText) {
  let cleanText = rawText.trim();
  if (cleanText.includes("```")) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) cleanText = match[1].trim();
  }
  return JSON.parse(cleanText);
}

// Quarantine: safely append anything that fails, instead of dropping it
async function quarantineFailure(inputData, rawModelOutput, errorDetails) {
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    input: inputData,
    rawOutput: rawModelOutput,
    error: errorDetails,
  });
  await fs.promises.appendFile(quarantinePath, logEntry + "\n", "utf-8");
}