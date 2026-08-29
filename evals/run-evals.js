import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.join(__dirname, "cases.json");

async function executeEvaluationSuite() {
  const cases = JSON.parse(await fs.promises.readFile(casesPath, "utf-8"));
  let matches = 0;
  const failures = [];

  console.log(`\n🚀 Starting evaluation execution: ${cases.length} target test cases...`);

  for (const tc of cases) {
    try {
      const response = await fetch("http://localhost:3000/your-thing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: tc.input, userId: "eval_runner_node" }),
      });
      if (!response.ok) { failures.push({ id: tc.id, name: tc.name, reason: "HTTP status execution breakdown" }); continue; }

      const result = await response.json();
      const statusMatches = result.status === tc.expected.status;
      const priorityMatches = result.extractedData?.priority === tc.expected.priority;

      if (statusMatches && priorityMatches) matches++;
      else failures.push({ id: tc.id, name: tc.name, expected: tc.expected,
                            received: { status: result.status, priority: result.extractedData?.priority } });
    } catch (err) {
      failures.push({ id: tc.id, name: tc.name, reason: `Execution error: ${err.message}` });
    }
  }

  const percentage = ((matches / cases.length) * 100).toFixed(1);
  console.log(`\n📊 Evaluation Results Summary:`);
  console.log(`Score: ${matches} / ${cases.length} Passed (${percentage}%)`);
  if (failures.length > 0) console.log(JSON.stringify(failures, null, 2));
  else console.log(`\n✅ Perfect alignment across all baseline validation targets!`);
}

executeEvaluationSuite();