# Contract Schema Reference

This guide mirrors Appendix A of the book and the schema files in `schemas/`.

## Minimum Viable Contract

The minimum viable contract makes one capability navigable now. It needs:

- `id` as a semantic capability identifier
- `version` as MAJOR.MINOR.PATCH
- `owner` as the accountable person or team
- `state` as `draft`, `active`, `deprecated`, or `retired`
- `name` as a human-readable capability label
- `description` as business intent and why the capability exists
- `inputs` as declared inputs with constraints
- `outputs` as declared outputs with guarantees
- `non_goals` as explicit boundaries
- `use_cases` as the business intents the capability satisfies
- `open_questions` as unresolved decisions, empty before `state: active`

## Extended Contract

The extended contract adds three layers:

- `dependencies` to explain upstream capability requirements
- `performance`, `error_handling`, `trust_zone`, `rate_limits`, `inherited_constraints`, and `constraint_history` to capture behavioral rules
- `deprecation_timeline`, `migration_path`, `versioning_strategy`, and `version_history` to describe evolution over time

## What To Write

Write intent, constraint, and rationale. Write what the capability does, why it exists, what it depends on, what it promises, and what it refuses to do.

## What Not To Write

Do not write implementation detail in the description field. Do not leave `non_goals` empty. Do not leave `open_questions` open on an active contract.
