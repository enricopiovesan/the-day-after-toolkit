---
title: Contract Schema Reference
permalink: /docs/contract-schema-reference/
---

# Contract Schema Reference

The minimum viable contract and extended contract share the same core structure. Both are written so a practitioner can navigate the capability without reverse-engineering the implementation.

## Minimum Viable Fields

`id` identifies the capability with semantic naming. Use lowercase slash-delimited paths like `payment/retry`.
`version` tracks contract evolution using semantic versioning. Use `MAJOR.MINOR.PATCH`.
`owner` names the accountable team or individual.
`state` captures lifecycle stage. Use `draft`, `active`, `deprecated`, or `retired`.
`name` gives the capability a readable label.
`description` explains what the capability does and why it exists. Write business intent, not implementation mechanics.
`inputs` names the declared inputs and the constraints that matter to the business. Each input needs a name, a JSON-compatible type, a required flag, and a business constraint.
`outputs` names the declared outputs and the guarantees they provide. Each output needs a name, a JSON-compatible type, and a guarantee statement.
`non_goals` says what the capability does not do.
`use_cases` shows the business context in plain language.
`open_questions` lists unresolved decisions and must be empty before `state: active`.

## Extended Fields

`dependencies` names upstream capabilities, version constraints, and rationale.
`performance` declares response and throughput thresholds.
`error_handling` describes the expected response for named error conditions.
`trust_zone` identifies whether the capability is internal, external, or privileged.
`rate_limits` records request ceilings and burst allowances.
`inherited_constraints` captures policy passed down from a higher-level source.
`constraint_history` preserves the incidents and lessons that explain why the capability behaves the way it does.
`deprecation_timeline`, `migration_path`, `versioning_strategy`, and `version_history` describe lifecycle changes over time.

## What To Write

Write intent, guarantees, boundaries, and history in plain language. If a field starts describing retries, caches, queues, polling, or backoff just because of the implementation, rewrite it toward the business rule that justifies it.

## What Not To Write

Do not restate code structure, method names, infrastructure details, or internal optimization choices in the contract. If a field is empty because the team does not know the answer yet, keep it open instead of inventing implementation-shaped text.

## Writing Rule

Write the contract so a practitioner can understand the capability without reverse-engineering the code. If a field only describes implementation mechanics, rewrite it until it expresses intent or behavior.
