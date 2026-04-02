# The Day After Toolkit — Agent Context

This repository uses the C-DAD (Contract-Driven AI Development) model.
All capabilities in this system are declared in `cdad/` as contracts.

## How to navigate this system

Before modifying any capability, read its contract:
`cdad/[domain]/[subdomain]/[action]/contract.yaml`

The contract declares:
- What the capability does and WHY it exists
- What it depends on and why
- What behavioral rules govern it at runtime
- What it does NOT do
- What has been tried before and failed

## Capability graph

The full capability dependency graph is in `cdad-graph.json`.
Read this before making changes that affect multiple capabilities.

## Contract rules for agents

1. Never modify a capability in a way that violates its declared non-goals
2. Never remove a behavioral constraint without updating the contract
3. If you encounter a code path that has no contract coverage, flag it —
   do not infer intent from implementation
4. If a constraint is missing from the contract but you find it in the code,
   surface it — do not assume it is intentional

## Validate your changes

After modifying any capability, run:
`cdad validate cdad/[capability-path]/contract.yaml`

A contract violation must be resolved before the change is committed.

## Current agent-readiness score

Run `cdad check` to generate `cdad-report.md`, then link the live report here once the repository has one.

## Working Rule

If a contract, a workflow, and the code disagree, stop and identify the mismatch before you make the change. The contract is the navigation surface, not the implementation detail.
