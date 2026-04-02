import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const COVERAGE_SUMMARY_PATH = resolve("coverage", "coverage-summary.json");

const BUSINESS_LOGIC_TARGETS = [
  "src/roadmap/prioritizer.ts"
];

const REQUIRED_PERCENT = 100;

/**
 * This gate is intentionally strict for deterministic business logic.
 * As additional business-logic modules become real implementations, add them to
 * BUSINESS_LOGIC_TARGETS so the gate stays aligned with repo policy.
 */
async function main() {
  const rawSummary = await readFile(COVERAGE_SUMMARY_PATH, "utf8");
  const summary = JSON.parse(rawSummary);

  const failures = BUSINESS_LOGIC_TARGETS.flatMap((target) => {
    const metrics = summary[target];

    if (!metrics) {
      return [`Missing coverage metrics for ${target}. Ensure the file is included in the test run.`];
    }

    const checks = [
      ["lines", metrics.lines?.pct ?? 0],
      ["functions", metrics.functions?.pct ?? 0],
      ["branches", metrics.branches?.pct ?? 0],
      ["statements", metrics.statements?.pct ?? 0]
    ];

    return checks
      .filter(([, pct]) => pct < REQUIRED_PERCENT)
      .map(([name, pct]) => `${target} ${name} coverage is ${pct}%, expected ${REQUIRED_PERCENT}%`);
  });

  if (failures.length > 0) {
    console.error("Business logic coverage gate failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Business logic coverage gate passed.");
}

main().catch((error) => {
  console.error("Failed to evaluate business logic coverage:");
  console.error(error);
  process.exit(1);
});
