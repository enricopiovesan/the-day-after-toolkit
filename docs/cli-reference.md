# CLI Reference

The `cdad` CLI is the executable layer of the toolkit. Each command follows the same output contract: a command header, a divider, the content block, generated file paths when applicable, and a `Next step` line.

## Commands

`cdad check` assesses repo agent-readiness and writes `cdad-report.md`.

`cdad roadmap` prioritizes capabilities from a prior check report.

`cdad init <capability-id>` scaffolds a contract triple under `cdad/`.

`cdad validate <path>` checks contract files, versioning rules, and generated artifact consistency.

`cdad graph` renders the capability dependency graph as Mermaid, JSON, and Markdown artifacts.

## Output Files

- `cdad-report.md` is the agent-readiness report written by `check`
- `cdad-roadmap.md` is the prioritization output written by `roadmap`
- `cdad/<capability-id>/contract.yaml`, `contract.json`, and `contract.md` are created by `init`
- `cdad-graph.mmd`, `cdad-graph.json`, and `cdad-graph.md` are created by `graph`

## Validation Notes

The JSON adjacency list produced by `graph` is intended to be stable and agent-consumable.
The report and roadmap frontmatter must remain parseable so other tools can read them without scraping prose.
