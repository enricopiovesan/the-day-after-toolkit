import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import inquirer from "inquirer";
import { describe, expect, it, vi } from "vitest";

import { registerCheckCommand } from "./check.js";
import { registerGraphCommand } from "./graph.js";
import { registerInitCommand } from "./init.js";
import { registerRoadmapCommand } from "./roadmap.js";
import { registerValidateCommand } from "./validate.js";

describe("command registration", () => {
  it("registers the check command and formats errors from the action handler", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerCheckCommand(program as never);

    await invoke(program.actions.check, {
      output: "cdad-report.md",
      capabilities: "11",
      skipScan: true,
      skipQuestions: true,
      format: "markdown"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad check failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });

  it("registers the roadmap command and formats action failures", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerRoadmapCommand(program as never);

    await invoke(program.actions.roadmap, {
      input: "missing-report.md",
      output: "cdad-roadmap.md",
      format: "markdown"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad roadmap failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });

  it("registers the init command and formats action failures", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerInitCommand(program as never);

    await invoke(program.actions.init, "Bad Capability", {
      noPrompts: true,
      output: "cdad"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad init failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });

  it("registers the init command and runs the interactive path", async () => {
    const repoRoot = await createRepoFixture();
    const program = createProgramStub();
    const prompt = vi.spyOn(inquirer, "prompt").mockResolvedValue({
      name: "Payment Retry",
      owner: "payments-team",
      state: "active",
      description: "Decide whether a failed payment can be retried without double charging."
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(repoRoot);

    registerInitCommand(program as never);

    await invoke(program.actions.init, "payment/retry", {
      output: "cdad"
    });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("Scaffolding complete for payment/retry."));

    prompt.mockRestore();
    log.mockRestore();
    cwd.mockRestore();
  });

  it("registers the validate command and formats action failures", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerValidateCommand(program as never);

    await invoke(program.actions.validate, "/definitely/missing/contract.yaml", {
      format: "json"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad validate failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });

  it("registers the graph command and formats invalid state failures", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerGraphCommand(program as never);

    await invoke(program.actions.graph, undefined, {
      state: "bogus"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad graph failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });
});

function createProgramStub() {
  const actions: Record<string, unknown> = {};

  return {
    actions,
    command(name: string) {
      const chain = {
        description: () => chain,
        option: () => chain,
        argument: () => chain,
        action: (handler: unknown) => {
          actions[name] = handler;
          return chain;
        }
      };

      return chain;
    }
  };
}

async function invoke(action: unknown, ...args: unknown[]): Promise<void> {
  if (typeof action === "function") {
    await action(...args);
  }
}

async function createRepoFixture(): Promise<string> {
  const repoRoot = join(tmpdir(), `cdad-init-register-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await mkdir(repoRoot, { recursive: true });
  await writeFile(
    join(repoRoot, "package.json"),
    JSON.stringify({ name: "cdad", private: true }, null, 2),
    "utf8"
  );

  return repoRoot;
}
