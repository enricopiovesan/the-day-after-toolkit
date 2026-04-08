# The Day After Toolkit — Agent Context

This repository uses the C-DAD (Contract-Driven AI Development) model.
Use this file as a template for repositories that store capability
contracts under a `cdad/` directory and validate them with the toolkit
commands in this repo.

## How to navigate this system

Before modifying any capability in a contract-driven repository, read
its contract:
`cdad/[domain]/[subdomain]/[action]/contract.yaml`

The contract declares:
- What the capability does and WHY it exists
- What it depends on and why
- What behavioral rules govern it at runtime
- What it does NOT do
- What has been tried before and failed

## Capability graph

Generate the capability dependency graph before making changes that
affect multiple capabilities:
`cdad graph --root cdad --output cdad-graph.json`

Review the generated `cdad-graph.json` rather than assuming dependency
intent from the code alone.

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

When bootstrapping a new capability, start from:
`cdad init [domain/subdomain/action] --output cdad`

A contract violation must be resolved before the change is committed.

## Current agent-readiness score

Run `cdad check --root cdad` to assess the repository.
If your workflow exports a report artifact, link that generated file in
repo-specific docs after it exists.

## Working Rule

If a contract, a workflow, and the code disagree, stop and identify the mismatch before you make the change. The contract is the navigation surface, not the implementation detail.
