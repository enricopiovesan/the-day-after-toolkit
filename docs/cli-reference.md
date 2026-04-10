---
title: CLI Reference
permalink: /docs/cli-reference/
---

# CLI Reference

The `cdad` CLI is the executable layer of the toolkit. Each command follows the same output contract: a command header, a divider, the content block, generated file paths when applicable, and a `Next step` line.

## Commands

`cdad check` assesses repo agent-readiness and writes `cdad-report.md`. It uses the static signals in the repo, asks up to five capabilities the four legibility questions, and returns a 0 to 10 score with a band.

`cdad roadmap` prioritizes capabilities from a prior check report. It reads `cdad-report.md`, asks for criticality and frequency, multiplies the three axes, and writes `cdad-roadmap.md`.

`cdad init <capability-id>` scaffolds a contract triple under `cdad/`. It validates capability IDs in `domain/subdomain/action` form, can scaffold the extended template when needed, and can pull roadmap notes into the new contract.

`cdad validate <path>` checks contract files, versioning rules, and generated artifact consistency. It also supports `--all`, `--strict`, `--fix`, and `--install-hook`.

`cdad graph` renders the capability dependency graph as Mermaid, JSON, and Markdown artifacts. The JSON adjacency list is the stable machine-friendly output.

## Output Files

- `cdad-report.md` is the agent-readiness report written by `check`
- `cdad-roadmap.md` or `cdad-roadmap.json` is the prioritization output written by `roadmap`
- `cdad/<capability-id>/contract.yaml`, `contract.json`, and `contract.md` are created by `init`
- `cdad-graph.mmd`, `cdad-graph.json`, and `cdad-graph.md` are created by `graph`

## Command Flags

- `cdad check --output <path>` changes the report path
- `cdad check --capabilities <n>` changes how many capabilities are scored in the questionnaire
- `cdad check --skip-scan` skips static analysis and asks questions only
- `cdad check --skip-questions` skips the questionnaire and runs the static scan only
- `cdad check --format json` writes JSON output instead of Markdown
- `cdad check --quiet` keeps the output focused on the terminal summary
- `cdad roadmap --input <path>` reads a different report file
- `cdad roadmap --output <path>` writes the roadmap to a different file
- `cdad roadmap --format json` writes JSON output instead of Markdown
- `cdad init --extended` scaffolds the extended contract template
- `cdad init --no-prompts` writes placeholders instead of prompting
- `cdad init --output <dir>` changes the base output directory from `cdad`
- `cdad validate --all` validates every contract in the repo
- `cdad validate --strict` turns warnings into errors
- `cdad validate --format json` emits machine-readable validation output
- `cdad validate --fix` attempts safe warning fixes
- `cdad validate --install-hook` installs the pre-commit hook
- `cdad graph --capability <id>` scopes the graph to one capability
- `cdad graph --domain <name>` scopes the graph to one domain
- `cdad graph --state <state>` filters by lifecycle state
- `cdad graph --output <dir>` changes the output directory
- `cdad graph --no-mermaid` skips Mermaid output
- `cdad graph --no-json` skips JSON output

## Output Notes

The JSON adjacency list produced by `graph` is intentionally stable and agent-consumable. It is the format to depend on if you are feeding graph state into other tooling.

The report and roadmap frontmatter must remain parseable so other tools can read them without scraping prose.

`cdad validate --install-hook` installs a POSIX shell pre-commit hook that runs validation before commits land.

## Recommended Usage Pattern

Run `cdad check` to establish a baseline, `cdad roadmap` to choose the next capability, `cdad init` to create the contract files, `cdad validate --all --strict` before commit, and `cdad graph` whenever you want to inspect dependency coverage or share the current topology.
