import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.join(__dirname, "cases.json");
const port = process.env.PORT || 3005;

async function executeEvaluationSuite() {
  const cases = JSON.parse(await fs.promises.readFile(casesPath, "utf-8"));
  let matches = 0;
  const failures = [];

  console.log(`\n🚀 Starting evaluation execution: ${cases.length} target test cases...`);

  for (const tc of cases) {
    try {
      const response = await fetch(`http://localhost:${port}/your-thing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: tc.input, userId: "eval_runner_node" }),
      });
      
      if (!response.ok) {
        failures.push({
          id: tc.id,
          name: tc.name,
          reason: `HTTP status ${response.status}`,
          expected: tc.expected,
        });
        continue;
      }

      const result = await response.json();
      const statusMatches = result.status === tc.expected.status;
      const priorityMatches = result.extractedData?.priority === tc.expected.priority;

      if (statusMatches && priorityMatches) {
        matches++;
        console.log(`  [PASS] ${tc.id}: ${tc.name} -> status: ${result.status}, priority: ${result.extractedData?.priority}`);
      } else {
        failures.push({
          id: tc.id,
          name: tc.name,
          expected: tc.expected,
          received: {
            status: result.status,
            priority: result.extractedData?.priority,
          },
        });
        console.log(`  [FAIL] ${tc.id}: ${tc.name} -> expected status "${tc.expected.status}" & priority "${tc.expected.priority}", got status "${result.status}" & priority "${result.extractedData?.priority}"`);
      }
    } catch (err) {
      failures.push({
        id: tc.id,
        name: tc.name,
        reason: `Execution error: ${err.message}`,
        expected: tc.expected,
      });
      console.log(`  [ERROR] ${tc.id}: ${tc.name} -> ${err.message}`);
    }
  }

  const percentage = ((matches / cases.length) * 100).toFixed(1);
  console.log(`\n========================================`);
  console.log(`📊 Evaluation Results Summary:`);
  console.log(`Score: ${matches} / ${cases.length} Passed (${percentage}%)`);
  console.log(`Key Field Match Rate: ${percentage}%`);
  console.log(`========================================\n`);

  if (failures.length > 0) {
    console.log(`❌ Failed Cases List (${failures.length}):`);
    console.log(JSON.stringify(failures, null, 2));
  } else {
    console.log(`✅ Perfect alignment across all baseline validation targets!`);
  }

  return { matches, total: cases.length, percentage, failures };
}

executeEvaluationSuite();