# The Day After Toolkit

Check whether a codebase is ready for AI agents, then scaffold the contracts and artifacts needed to make it navigable.

## Quick Start: Two Paths

### I want to check if my repo is ready for AI agents (5 minutes)

```bash
npm install -g cdad
cdad check
```

### I want to implement the full model

Start with [docs/adoption-journey.md](docs/adoption-journey.md).

## The Six Commands

| Command | What it does | When to use it |
|---|---|---|
| `cdad check` | Assesses agent-readiness and produces `cdad-report.md` | When you need an honest starting score |
| `cdad roadmap` | Prioritizes extraction candidates into phases | After running `cdad check` |
| `cdad init` | Scaffolds a contract triple for one capability | When you are ready to author a contract |
| `cdad validate` | Validates contracts, rules, and sync state | Before commit and in CI |
| `cdad graph` | Builds the capability dependency graph | When you need topology and coverage visibility |
| `cdad check` | Re-run to measure progress over time | After each extraction phase |

## What `cdad check` Produces

The CLI prints a terminal summary and writes a machine-parseable `cdad-report.md` with frontmatter for humans and agents.

## Templates

Contract, audit, and prioritization templates live under [`templates/`](templates/README.md). Use the minimum viable contract to make a capability navigable now, then move to the extended contract when the capability needs deeper dependency, behavioral, and evolutionary context.

## Claude / Cursor / Codex Configurations

Prompt and agent configuration files live under [`claude-configs/`](claude-configs/README.md) and [`agent-configs/`](agent-configs/README.md). They are designed to work with this repo's schemas, commands, and generated artifacts.

## From the book

This toolkit accompanies *The Day After: How to Restructure Your Software Company for the Age of AI Agents* by Enrico Piovesan and turns the book's operating model into executable tooling.

## License | Contributing | Author

- License: [Apache-2.0](LICENSE)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Specs: [openspec/README.md](openspec/README.md)
- Author: Enrico Piovesan
