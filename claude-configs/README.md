# Claude / Cursor / Codex Configurations

These prompt assets are designed to work with the schemas, templates, and generated artifacts in this repository.

They are shared Markdown assets rather than tool-specific config files,
so the same prompt can be used in Claude Projects, Cursor rules, or
Codex instructions.

## Included Prompts

- `contract-author.md` helps a practitioner write a contract from business intent
- `contract-reviewer.md` checks contracts for completeness and anti-patterns
- `legibility-auditor.md` runs the audit questions interactively
- `extraction-agent.md` helps turn brownfield systems into a prioritized extraction plan
- `contract-maintenance-agent.md` looks for contract drift and stale assumptions

## How to use them

For Claude:
- create a project for contract work and paste one of these files into the project instructions
- attach the relevant contract or spec files from this repository so the prompt can reference real schemas and examples

For Cursor:
- copy the prompt text into a repo rule or chat instruction before asking for contract authoring or audit help
- keep the current workspace open so the agent can inspect `schemas/`, `templates/`, and generated `cdad/` artifacts

For Codex:
- use the prompt as the system or task framing for a focused contract-writing or audit session
- point the agent at the actual toolkit commands it should use for verification

## Recommended workflow

1. Draft or refine a contract with `contract-author.md`.
2. Validate the result with `cdad validate cdad/[capability-path]/contract.yaml`.
3. Check repository readiness with `cdad check --root cdad`.
4. Generate a graph when dependency reasoning matters with `cdad graph --root cdad --output cdad-graph.json`.
5. Use `legibility-auditor.md` or `contract-reviewer.md` to review gaps before implementation work starts.
