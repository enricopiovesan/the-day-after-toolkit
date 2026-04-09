# The Day After Toolkit

Check whether a codebase is ready for AI agents, then scaffold the contracts and artifacts needed to make it navigable.

## Quick Start: Two Paths

### I want to check if my repo is ready for AI agents (5 minutes)

```bash
npm install -g cdad
cdad check
```

You get a terminal scorecard plus a `cdad-report.md` file that captures the repo's current legibility, missing signals, and the next recommended move.

### I want to implement the full model

Start with [docs/adoption-journey.md](docs/adoption-journey.md), then use the commands in sequence:

```bash
cdad check
cdad roadmap
cdad init payments/retry/execute
cdad validate --all --strict
cdad graph
```

## The Six Commands

| Command | What it does | When to use it |
|---|---|---|
| `cdad check` | Assesses agent-readiness and produces `cdad-report.md` | When you need an honest starting score |
| `cdad roadmap` | Prioritizes extraction candidates into phases | After running `cdad check` |
| `cdad init` | Scaffolds a contract triple for one capability | When you are ready to author a contract |
| `cdad validate` | Validates contracts, rules, and sync state | Before commit and in CI |
| `cdad graph` | Builds the capability dependency graph | When you need topology and coverage visibility |
| `cdad check` again | Re-runs the same diagnostic so you can measure improvement | After each extraction phase |

## What `cdad check` Produces

The CLI prints a terminal summary and writes a machine-parseable `cdad-report.md` with YAML frontmatter on line 1. The report includes the overall score, band, static scan results, legibility assessment, gap inventory, and the next step.

In Phase 1, the report is the bridge between discovery and action: it tells you what the repo already makes legible, what is still missing, and which capability should be scaffolded first.

## Generated Artifacts

The toolkit writes a small, stable set of files so humans and agents can work from the same material:

- `cdad-report.md` from `cdad check`
- `cdad-roadmap.md` or `cdad-roadmap.json` from `cdad roadmap`
- `cdad/<capability-id>/contract.yaml`, `contract.json`, and `contract.md` from `cdad init`
- `cdad-graph.md`, `cdad-graph.mmd`, and `cdad-graph.json` from `cdad graph`

`cdad-graph.json` is the stable machine-facing adjacency format. If you are integrating another tool or agent, prefer that JSON output over scraping Markdown.

## Templates

Contract, audit, and prioritization templates live under [`templates/`](templates/README.md). Use the minimum viable contract to make a capability navigable now, then move to the extended contract when the capability needs deeper dependency, behavioral, and evolutionary context.

## Claude / Cursor / Codex Configurations

Prompt and agent configuration files live under [`claude-configs/`](claude-configs/README.md) and [`agent-configs/`](agent-configs/README.md). They are designed to work with this repo's schemas, commands, and generated artifacts.

## From the book

This toolkit accompanies *The Day After: How to Restructure Your Software Company for the Age of AI Agents* by Enrico Piovesan and turns the book's operating model into executable tooling.

## Further Reading

- [docs/cli-reference.md](docs/cli-reference.md) for every command flag and output artifact
- [docs/concepts.md](docs/concepts.md) for the glossary used across the toolkit
- [docs/contract-schema-reference.md](docs/contract-schema-reference.md) for contract field semantics
- [docs/anti-patterns.md](docs/anti-patterns.md) for failure modes that make contracts hard to trust
- [docs/semver-for-contracts.md](docs/semver-for-contracts.md) for versioning rules

## Maintainer Note

GitHub repository topics are still a manual step. Before public launch, align the GitHub topics with the package keywords and current README framing.

## License | Contributing | Author

- License: [Apache-2.0](LICENSE)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Specs: [openspec/README.md](openspec/README.md)
- Author: Enrico Piovesan
