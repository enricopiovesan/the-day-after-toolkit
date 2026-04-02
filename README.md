# The Day After Toolkit

Assess whether a codebase is ready for AI agents and scaffold the contracts and artifacts that make its capabilities legible.

## Is your codebase ready for AI agents?

The toolkit gives you an honest starting score, not a sales pitch. It shows where legibility is missing, then gives you the artifacts to close the gap. That makes the next step concrete instead of symbolic.

## Quick Start: Two Paths

### I just want to check my repo (5 minutes)

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
| `cdad check` | Re-run the audit to measure progress over time | After each extraction phase |

## What `cdad check` Produces

The CLI prints a terminal summary and writes a machine-parseable `cdad-report.md` with frontmatter for humans and agents.

```text
cdad check — Agent Readiness Report
────────────────────────────────────

Static scan: 4/10 signals found
Questionnaire: 3 capabilities assessed

Overall score: 3.4 / 10  PARTIALLY AGENT-READY

Top gaps identified:
  payment/retry       constraint history absent, dependency rationale absent
  auth/session/login  exception logic absent
  inventory/reserve   business rules partially documented

Full report saved to: cdad-report.md

Next step: run `cdad roadmap` to generate your transformation plan.
```

See [docs/example-cdad-report.md](docs/example-cdad-report.md) for the matching report structure.

## Templates

Contract, audit, and prioritization templates live under [templates/](templates/README.md). Use the minimum viable contract to make a capability navigable now. Move to the extended contract when a capability needs deeper dependency, behavioral, and evolutionary context.

## Claude / Cursor / Codex Configurations

Prompt and agent configuration files live under [claude-configs/](claude-configs/README.md) and [agent-configs/](agent-configs/README.md). They are designed to work with this repo's schemas, commands, and generated artifacts. Use them when you want an assistant to author, review, extract, or maintain contracts without drifting from the toolkit rules.

## From the book

This toolkit accompanies *The Day After: How to Restructure Your Software Company for the Age of AI Agents* by Enrico Piovesan. It implements the framework the book teaches so a team can check readiness, prioritize extraction, and author capability contracts in one place.

## License | Contributing | Author

- License: [Apache-2.0](LICENSE)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Specs: [openspec/README.md](openspec/README.md)
- Author: Enrico Piovesan
