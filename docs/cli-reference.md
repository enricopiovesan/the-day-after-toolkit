# CLI Reference

This reference documents the intended `cdad` command surface from the toolkit spec. The implementation is in progress, but the file layout, flags, and output contracts below are the ones the repo is building toward.

## Shared Output Contract

Every command prints a short header, its content, and a `Next step` line. Errors go to stderr and should name the problem, the location, and the fix.

## `cdad check`

Purpose: assess agent-readiness with a static scan and a four-question legibility audit.
Flags: `--output`, `--capabilities`, `--skip-scan`, `--skip-questions`, `--format`, `--quiet`.
Outputs: `cdad-report.md` by default, or JSON when requested.

## `cdad roadmap`

Purpose: read `cdad-report.md` and prioritize capabilities by business criticality, legibility density, and agent touchpoint frequency.
Flags: `--input`, `--output`, `--format`.
Outputs: `cdad-roadmap.md` by default, or JSON when requested.

## `cdad init`

Purpose: scaffold a contract triple for one capability.
Flags: `--extended`, `--no-prompts`, `--output`.
Outputs: `contract.yaml`, `contract.json`, and `contract.md` under `cdad/[capability-id]/`.

## `cdad validate`

Purpose: validate contracts, versioning rules, dependency consistency, and sync state.
Flags: `--all`, `--strict`, `--format`, `--fix`, `--install-hook`.
Outputs: validation summary, warnings, errors, and optional hook install.

## `cdad graph`

Purpose: render the capability dependency graph from contracts in `cdad/`.
Flags: `--capability`, `--domain`, `--state`, `--output`, `--no-mermaid`, `--no-json`.
Outputs: `cdad-graph.mmd`, `cdad-graph.json`, and `cdad-graph.md`.

## Stable Artifacts

The JSON adjacency list produced by `cdad graph` is an agent-consumable artifact and must remain stable across versions.

## Example Report

See [example-cdad-report.md](example-cdad-report.md) for the report structure that `cdad check` writes.
