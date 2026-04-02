# CLI Reference

The `cdad` CLI is the executable layer of the toolkit. Each command follows the same output contract: a command header, a divider, the content block, generated file paths when applicable, and a `Next step` line.

## Commands

`cdad check` assesses repo agent-readiness and writes `cdad-report.md`. It uses the static signals in the spec, asks up to five capabilities the four legibility questions, and returns a 0 to 10 score with a band.

`cdad roadmap` prioritizes capabilities from a prior check report. It reads `cdad-report.md`, asks for criticality and frequency, multiplies the three axes, and writes `cdad-roadmap.md`.

`cdad init <capability-id>` scaffolds a contract triple under `cdad/`. It validates capability IDs in `domain/subdomain/action` form and can scaffold the extended template when needed.

`cdad validate <path>` checks contract files, versioning rules, and generated artifact consistency. It also supports `--all`, `--strict`, `--fix`, and `--install-hook`.

`cdad graph` renders the capability dependency graph as Mermaid, JSON, and Markdown artifacts. The JSON adjacency list is the stable machine-friendly output.

## Output Files

- `cdad-report.md` is the agent-readiness report written by `check`
- `cdad-roadmap.md` is the prioritization output written by `roadmap`
- `cdad/<capability-id>/contract.yaml`, `contract.json`, and `contract.md` are created by `init`
- `cdad-graph.mmd`, `cdad-graph.json`, and `cdad-graph.md` are created by `graph`

## Command Flags

- `cdad check --output <path>` changes the report path
- `cdad check --skip-scan` skips static analysis and asks questions only
- `cdad check --skip-questions` skips the questionnaire and runs the static scan only
- `cdad check --format json` writes JSON output instead of Markdown
- `cdad roadmap --input <path>` reads a different report file
- `cdad roadmap --output <path>` writes the roadmap to a different file
- `cdad init --extended` scaffolds the extended contract template
- `cdad init --no-prompts` writes placeholders instead of prompting
- `cdad validate --all` validates every contract in the repo
- `cdad validate --strict` turns warnings into errors
- `cdad validate --format json` emits machine-readable validation output
- `cdad validate --fix` attempts safe warning fixes
- `cdad validate --install-hook` installs the pre-commit hook
- `cdad graph --capability <id>` scopes the graph to one capability
- `cdad graph --domain <name>` scopes the graph to one domain
- `cdad graph --state <state>` filters by lifecycle state

## Validation Notes

The JSON adjacency list produced by `graph` is intended to be stable and agent-consumable.
The report and roadmap frontmatter must remain parseable so other tools can read them without scraping prose.
`cdad validate --install-hook` installs a POSIX shell pre-commit hook that runs validation before commits land.
