# Agent Configurations

These files show how a contract-driven repository should instruct coding agents
to navigate and validate their work in Claude, Cursor, and Codex.

## Included Files

- `CLAUDE.md` is the repo-level context file. Use it directly as `CLAUDE.md`,
  adapt it into Cursor project rules, or paste it into a Codex system prompt.
- `contract-aware-coding-agent.md` is the task-level implementation prompt for
  code changes that must honor contracts and generated artifacts.

## How to use them

1. Load `CLAUDE.md` first so the agent has the repo map.
2. Pair it with `contract-aware-coding-agent.md` for implementation work.
3. Keep `docs/cli-reference.md`, `docs/contract-schema-reference.md`, and the
   active contract or worked example open while coding.
