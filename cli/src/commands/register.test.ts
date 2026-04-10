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

    await (program.actions.check as any)?.({
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

    await (program.actions.roadmap as any)?.({
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

    await (program.actions.init as any)?.("Bad Capability", {
      noPrompts: true,
      output: "cdad"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad init failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });

  it("registers the validate command and formats action failures", async () => {
    const program = createProgramStub();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    registerValidateCommand(program as never);

    await (program.actions.validate as any)?.("/definitely/missing/contract.yaml", {
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

    await (program.actions.graph as any)?.(undefined, {
      state: "bogus"
    });

    expect(error).toHaveBeenCalledWith(expect.stringContaining("cdad graph failed:"));
    expect(process.exitCode).toBe(1);

    error.mockRestore();
    process.exitCode = undefined;
  });
});

function createProgramStub() {
  const actions: Record<string, any> = {};

  return {
    actions,
    command(name: string) {
      const chain = {
        description: () => chain,
        option: () => chain,
        argument: () => chain,
        action: (handler: any) => {
          actions[name] = handler;
          return chain;
        }
      };

      return chain;
    }
  };
}
