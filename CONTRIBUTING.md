# Contributing

The Day After Toolkit turns the book's argument into executable open source tooling. Contributions matter because the repo has to work for first-time practitioners, not only readers who already know the model.

## Before You Start

Please read:

- [README.md](/Users/piovese/Documents/the-day-after-toolkit/README.md)
- [ref/the-day-after-toolkit-spec.md](/Users/piovese/Documents/the-day-after-toolkit/ref/the-day-after-toolkit-spec.md)
- the reference material in `ref/`

## Acceptance Bar

Before a pull request merges, it must pass the required build, lint, test, schema validation, and contract validation checks.

## The Contract for This Repo

This repo must be useful to a first-time practitioner. Changes that break the reader or practitioner path are rejected even if the code is otherwise clean.

## Documentation Standard

README updates must preserve the required section order from the spec. CLI help text must document purpose, inputs, flags, outputs, and next step behavior. Template annotations must explain what to write and what not to write when the field is easy to misuse.

## Quality Standards

TypeScript runs in strict mode. No `any`, no `@ts-ignore`, and no lint warnings. Deterministic domain logic requires exhaustive automated coverage.

## Pull Requests

Every pull request should include:

- the relevant spec section reference
- test or validation evidence
- an example of changed output when user-facing behavior changes

## Issues

Use the issue templates when possible so work lands in the project board and milestones cleanly. Link the spec section that governs the behavior you are proposing or changing.

## Coverage Gate

The repository enforces a high bar for core business logic. Scoring, prioritization, validation, and report generation must keep the required coverage floor and should not merge when a branch reduces trust in deterministic behavior.

## Public Repo Hygiene

Keep `README.md`, `SECURITY.md`, `.github/CODEOWNERS`, and `CITATION.cff` current whenever project behavior, scope, or support expectations change.
