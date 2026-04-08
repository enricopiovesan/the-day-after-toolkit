import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { executeGraphCommand } from "./graph.js";

describe("executeGraphCommand", () => {
  it("renders mermaid, json, and markdown graph artifacts for repo contracts", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": MINIMUM_PAYMENT_RETRY,
      "cdad/payment/processor/status/contract.yaml": MINIMUM_PROCESSOR_STATUS,
      "cdad/auth/session/login/contract.yaml": EXTENDED_AUTH_LOGIN,
      "cdad/legacy/session/contract.yaml": DEPRECATED_LEGACY_SESSION
    });

    const execution = await executeGraphCommand(
      undefined,
      {
        output: join(repoRoot, "graph-output")
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");
    const mermaid = await readFile(join(repoRoot, "graph-output/cdad-graph.mmd"), "utf8");
    const json = await readFile(join(repoRoot, "graph-output/cdad-graph.json"), "utf8");

    expect(execution.output).toContain("Found 4 contracts.");
    expect(execution.output).toContain("Dependency edges: 2");
    expect(markdown).toContain("# Capability Graph");
    expect(markdown).toContain("| payment | 2 | 1 | 1 | 0 |");
    expect(markdown).toContain("legacy/session: Use auth/session/login instead.");
    expect(markdown).toContain("Resolve whether MFA belongs in this capability.");
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("payment_retry");

    const parsed = JSON.parse(json) as {
      capabilities: Array<{ id: string; dependencies: string[] }>;
      cycles: string[][];
    };
    expect(parsed.capabilities.find((node) => node.id === "auth/session/login")?.dependencies).toEqual([
      "payment/processor/status",
      "payment/retry"
    ]);
    expect(parsed.cycles).toEqual([]);
  });

  it("renders a capability subgraph and respects disabled outputs", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/payment/retry/contract.yaml": MINIMUM_PAYMENT_RETRY,
      "cdad/payment/processor/status/contract.yaml": MINIMUM_PROCESSOR_STATUS,
      "cdad/auth/session/login/contract.yaml": EXTENDED_AUTH_LOGIN
    });

    const execution = await executeGraphCommand(
      undefined,
      {
        capability: "auth/session/login",
        output: join(repoRoot, "graph-output"),
        mermaid: false,
        json: false
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");

    expect(execution.renderResult.mermaidPath).toBeNull();
    expect(execution.renderResult.jsonPath).toBeNull();
    expect(execution.output).toContain("Found 3 contracts.");
    expect(markdown).toContain("auth/session/login");
    expect(markdown).toContain("payment/retry");
    expect(markdown).toContain("payment/processor/status");
  });

  it("reports circular dependencies in terminal output and markdown", async () => {
    const repoRoot = await createRepoFixture({
      "cdad/a/one/contract.yaml": CYCLE_A,
      "cdad/b/two/contract.yaml": CYCLE_B
    });

    const execution = await executeGraphCommand(
      undefined,
      {
        output: join(repoRoot, "graph-output")
      },
      {
        cwd: repoRoot,
        now: () => new Date("2026-04-03T00:00:00Z")
      }
    );

    const markdown = await readFile(join(repoRoot, "graph-output/cdad-graph.md"), "utf8");

    expect(execution.output).toContain("Circular dependencies detected: 1");
    expect(markdown).toContain("a/one -> b/two -> a/one");
  });
});

async function createRepoFixture(
  files: Record<string, string>
): Promise<string> {
  const repoRoot = join(tmpdir(), `cdad-graph-command-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(repoRoot, { recursive: true });
  await writeFile(
    join(repoRoot, "package.json"),
    JSON.stringify({ name: "cdad", private: true }, null, 2),
    "utf8"
  );

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = join(repoRoot, relativePath);
    await mkdir(join(filePath, ".."), { recursive: true });
    await writeFile(filePath, contents, "utf8");
  }

  return repoRoot;
}

const MINIMUM_PAYMENT_RETRY = `id: payment/retry
version: 0.1.0
owner: payments-team
state: draft
name: Payment Retry
description: Decide whether a failed payment can be retried safely.
inputs: []
outputs: []
non_goals:
  - This capability does not execute the retry itself.
use_cases:
  - As payments, I need to decide whether a failed payment can be retried.
open_questions:
  - Document the processor rule before activation.
`;

const MINIMUM_PROCESSOR_STATUS = `id: payment/processor/status
version: 1.0.0
owner: payments-team
state: active
name: Processor Status
description: Report whether the processor still considers a payment in flight.
inputs: []
outputs: []
non_goals:
  - This capability does not mutate processor state.
use_cases:
  - As payments, I need processor status to avoid unsafe retries.
open_questions: []
`;

const EXTENDED_AUTH_LOGIN = `id: auth/session/login
version: 1.0.0
owner: auth-team
state: draft
name: Session Login
description: Establish a session after validating credentials and downstream safety checks.
inputs: []
outputs: []
non_goals:
  - This capability does not issue long-term credentials.
use_cases:
  - As auth, I need a reliable login path.
open_questions:
  - Resolve whether MFA belongs in this capability.
dependencies:
  - id: payment/retry
    version: ">=0.1.0"
    rationale: Payment retry state must be visible during certain payment-linked logins.
  - id: payment/processor/status
    version: ">=1.0.0"
    rationale: Processor state is checked when login must unblock payment recovery.
performance:
  response_time_p99_ms: 200
  throughput_rps: 50
  notes: Login must stay responsive during peak traffic.
error_handling: []
trust_zone: internal
rate_limits:
  requests_per_minute: 100
  burst_allowance: 10
  notes: Limit abusive retries.
inherited_constraints: []
constraint_history: []
deprecation_timeline: null
migration_path: null
versioning_strategy: Major versions cover breaking session changes.
version_history:
  - version: 1.0.0
    date: 2026-04-03
    changed: Initial contract.
`;

const DEPRECATED_LEGACY_SESSION = `id: legacy/session
version: 2.0.0
owner: auth-team
state: deprecated
name: Legacy Session
description: Support a shrinking set of legacy session consumers during migration.
inputs: []
outputs: []
non_goals:
  - This capability does not accept new integrations.
use_cases:
  - As auth, I need a temporary bridge for migrating clients.
open_questions: []
dependencies: []
performance:
  response_time_p99_ms: 150
  throughput_rps: 20
  notes: Legacy traffic should continue working during migration.
error_handling: []
trust_zone: internal
rate_limits:
  requests_per_minute: 40
  burst_allowance: 5
  notes: Keep enough headroom for migration traffic.
inherited_constraints: []
constraint_history: []
deprecation_timeline: null
migration_path: Use auth/session/login instead.
versioning_strategy: Major versions cover legacy client compatibility changes.
version_history:
  - version: 2.0.0
    date: 2026-04-03
    changed: Marked deprecated during migration.
`;

const CYCLE_A = `id: a/one
version: 1.0.0
owner: team-a
state: active
name: A One
description: First node in a cycle.
inputs: []
outputs: []
non_goals: []
use_cases: []
open_questions: []
dependencies:
  - id: b/two
    version: ">=1.0.0"
    rationale: Depends on B.
performance:
  response_time_p99_ms: 1
  throughput_rps: 1
  notes: Minimal.
error_handling: []
trust_zone: internal
rate_limits:
  requests_per_minute: 1
  burst_allowance: 1
  notes: Minimal.
inherited_constraints: []
constraint_history: []
deprecation_timeline: null
migration_path: null
versioning_strategy: Standard.
version_history:
  - version: 1.0.0
    date: 2026-04-03
    changed: Initial.
`;

const CYCLE_B = `id: b/two
version: 1.0.0
owner: team-b
state: active
name: B Two
description: Second node in a cycle.
inputs: []
outputs: []
non_goals: []
use_cases: []
open_questions: []
dependencies:
  - id: a/one
    version: ">=1.0.0"
    rationale: Depends on A.
performance:
  response_time_p99_ms: 1
  throughput_rps: 1
  notes: Minimal.
error_handling: []
trust_zone: internal
rate_limits:
  requests_per_minute: 1
  burst_allowance: 1
  notes: Minimal.
inherited_constraints: []
constraint_history: []
deprecation_timeline: null
migration_path: null
versioning_strategy: Standard.
version_history:
  - version: 1.0.0
    date: 2026-04-03
    changed: Initial.
`;
