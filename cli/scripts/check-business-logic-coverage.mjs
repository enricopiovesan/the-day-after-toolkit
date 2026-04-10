import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const COVERAGE_SUMMARY_PATH = resolve("coverage", "coverage-summary.json");

const BUSINESS_LOGIC_TARGETS = [
  {
    path: "src/audit/scorer.ts",
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100
    }
  },
  {
    path: "src/audit/report.ts",
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100
    }
  },
  {
    path: "src/roadmap/prioritizer.ts",
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100
    }
  }
];

const CLI_HANDLER_TARGETS = [
  {
    path: "src/commands/check.ts",
    thresholds: {
      lines: 80,
      functions: 70
    }
  },
  {
    path: "src/commands/roadmap.ts",
    thresholds: {
      lines: 80,
      functions: 70
    }
  },
  {
    path: "src/commands/init.ts",
    thresholds: {
      lines: 80,
      functions: 70
    }
  },
  {
    path: "src/commands/validate.ts",
    thresholds: {
      lines: 80,
      functions: 70
    }
  },
  {
    path: "src/commands/graph.ts",
    thresholds: {
      lines: 80,
      functions: 70
    }
  }
];

const OVERALL_THRESHOLDS = {
  lines: 75
};

/**
 * This gate is intentionally strict for deterministic business logic and keeps
 * command-handler and overall coverage aligned with the repo policy from #25.
 */
async function main() {
  const rawSummary = await readFile(COVERAGE_SUMMARY_PATH, "utf8");
  const summary = JSON.parse(rawSummary);
  const summaryEntries = Object.entries(summary);

  const failures = [
    ...evaluateTargets(summaryEntries, BUSINESS_LOGIC_TARGETS),
    ...evaluateTargets(summaryEntries, CLI_HANDLER_TARGETS),
    ...evaluateOverallThresholds(summary.total)
  ];

  if (failures.length > 0) {
    console.error("Business logic coverage gate failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Business logic coverage gate passed.");
}

function evaluateTargets(summaryEntries, targets) {
  return targets.flatMap((target) => {
    const matchedEntry = summaryEntries.find(([key]) => key === target.path || key.endsWith(`/${target.path}`));
    const metrics = matchedEntry?.[1];

    if (!metrics) {
      return [`Missing coverage metrics for ${target.path}. Ensure the file is included in the test run.`];
    }

    return Object.entries(target.thresholds)
      .filter(([metricName, required]) => (metrics?.[metricName]?.pct ?? 0) < required)
      .map(
        ([metricName, required]) =>
          `${target.path} ${metricName} coverage is ${metrics?.[metricName]?.pct ?? 0}%, expected ${required}%`
      );
  });
}

function evaluateOverallThresholds(totalMetrics) {
  return Object.entries(OVERALL_THRESHOLDS)
    .filter(([metricName, required]) => (totalMetrics?.[metricName]?.pct ?? 0) < required)
    .map(
      ([metricName, required]) =>
        `Overall ${metricName} coverage is ${totalMetrics?.[metricName]?.pct ?? 0}%, expected ${required}%`
    );
}

main().catch((error) => {
  console.error("Failed to evaluate business logic coverage:");
  console.error(error);
  process.exit(1);
});
