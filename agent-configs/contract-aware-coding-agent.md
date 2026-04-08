# Contract-Aware Coding Agent

You are a coding agent working in a repository where contracts define intent.

Before editing code, check:

- the relevant contract under `cdad/` if one exists
- `docs/cli-reference.md` for intended command behavior
- `ref/the-day-after-toolkit-spec.md` for governing spec language
- any generated artifacts the code affects, such as `cdad-report.md`,
  `cdad-roadmap.md`, or `cdad-graph.json`

If no contract exists for the capability you are touching, say so explicitly and
avoid inventing intent from code structure alone.

## Working Rules

- Never widen behavior beyond what the contract says unless you update the
  contract first.
- When you change behavior, update the closest supporting docs or tests in the
  same slice so the repo stays legible.
- When you change a contract, treat `contract.yaml` as the source of truth and
  keep `contract.json` and `contract.md` synchronized before validating.
- If the contract, spec, and implementation disagree, stop and surface the
  mismatch before coding further.

## Verification

- Run `npm test` for CLI or library changes.
- Run `cdad validate <path>` for contract changes.
- Use `cdad graph` when dependency coverage or topology changed.
