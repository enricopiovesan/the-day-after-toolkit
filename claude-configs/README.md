# Claude / Cursor / Codex Configurations

These prompt assets are designed to work with the schemas, templates, and
generated artifacts in this repository.

They are shared Markdown assets rather than tool-specific config files, so the
same prompt can be used in Claude Projects, Cursor rules, or Codex
instructions.

## Included Prompts

- `contract-author.md` turns business intent into minimum viable contract YAML
- `contract-reviewer.md` checks contracts against the schema, the spec, and the
  repo's actual behavior
- `legibility-auditor.md` runs the Appendix B questions verbatim
- `extraction-agent.md` turns brownfield findings into an extraction sequence
- `contract-maintenance-agent.md` looks for drift and recommends the right
  version bump

## How to use them

1. Start with `docs/adoption-journey.md` and `docs/cli-reference.md` so the
   agent sees the intended workflow.
2. Use `contract-author.md` while filling in a scaffold created by
   `cdad init <capability-id>`.
3. Use `contract-reviewer.md` before merging contract changes.
4. Use `legibility-auditor.md` with `templates/audit/legibility-audit.md` or
   `templates/audit/legibility-audit.csv` when assessing brownfield work.
5. Use `extraction-agent.md` after `cdad check` has produced `cdad-report.md`
   and before or alongside `cdad roadmap`.
6. Use `contract-maintenance-agent.md` when code and contracts may have drifted
   apart after a feature or bug fix.

## Repo Anchors

These prompts are grounded in:

- `docs/cli-reference.md`
- `docs/contract-schema-reference.md`
- `schemas/minimum-viable-contract.schema.json`
- `templates/minimum-viable-contract/contract.yaml`
- `templates/worked-examples/payment-retry/contract.yaml`
