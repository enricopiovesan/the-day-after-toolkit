# The Day After Toolkit — Agent Context

This repository uses the C-DAD (Contract-Driven AI Development) model.
The toolkit itself lives in the CLI, docs, templates, schemas, and repo
workflow files in this repository.

## Primary navigation surfaces

Read these before making non-trivial changes:

- `README.md`
- `docs/cli-reference.md`
- `docs/contract-schema-reference.md`
- `ref/the-day-after-toolkit-spec.md`
- `openspec/specs/repo-governance/spec.md`
- `templates/worked-examples/payment-retry/contract.yaml`

## How to navigate this system

Before modifying any capability, read its contract:
`cdad/[domain]/[subdomain]/[action]/contract.yaml`

The contract declares:
- What the capability does and WHY it exists
- What it depends on and why
- What behavioral rules govern it at runtime
- What it does NOT do
- What has been tried before and failed

If no contract exists yet, say that the capability is still uncovered and do
not infer intent from implementation alone.

## Capability graph

When present, the machine-readable dependency graph is in `cdad-graph.json`.
You can regenerate graph artifacts with `cdad graph`.

## Contract rules for agents

1. Never modify a capability in a way that violates its declared non-goals
2. Never remove a behavioral constraint without updating the contract
3. If you encounter a code path that has no contract coverage, flag it —
   do not infer intent from implementation
4. If a constraint is missing from the contract but you find it in the code,
   surface it — do not assume it is intentional

## Validate your changes

After modifying any capability contract, run:
`cdad validate cdad/[capability-path]/contract.yaml`

A contract violation must be resolved before the change is committed.

If you changed CLI behavior, docs, or generated artifact expectations, also
run:

- `npm test`
- `cdad validate --all --strict` when contracts changed

Use `docs/cli-reference.md` to confirm intended command behavior before you
change user-facing output or artifact paths.

## Current agent-readiness score

Run `cdad check` to generate `cdad-report.md`.
Run `cdad roadmap` to generate `cdad-roadmap.md`.
Treat those artifacts as the current planning surface when they are present.

## Working Rule

If a contract, a workflow, and the code disagree, stop and identify the mismatch before you make the change. The contract is the navigation surface, not the implementation detail.
