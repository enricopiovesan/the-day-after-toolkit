# Contributing

The Day After Toolkit turns the book's argument into executable open source tooling. Contributions matter because the repo has to work for first-time practitioners, not only readers who already know the model.

## Branching Rule

Never commit working changes directly to `main`. Every change starts on a proper branch, opens a pull request, and lands through review.

## Before You Start

Please read:

- [README.md](/Users/piovese/Documents/the-day-after-toolkit/README.md)
- [ref/the-day-after-toolkit-spec.md](/Users/piovese/Documents/the-day-after-toolkit/ref/the-day-after-toolkit-spec.md)
- the reference material in `ref/`
- [openspec/README.md](/Users/piovese/Documents/the-day-after-toolkit/openspec/README.md)

## Acceptance Bar

Before a pull request merges, it must pass the required build, lint, test, schema validation, and contract validation checks.
No pull request may merge if deterministic business logic falls below 100% unit test coverage.
No pull request may merge if the implementation drifts from the governing spec.

## The Contract for This Repo

This repo must be useful to a first-time practitioner. Changes that break the reader or practitioner path are rejected even if the code is otherwise clean.
The implementation must stay aligned to the authoritative spec for the change. If code and spec disagree, fix the spec first or do not merge the code.

## Spec Workflow

Use [OpenSpec](https://openspec.dev/) to define and evolve specs in this repository.
Specs live in `openspec/specs/` and change proposals live in `openspec/changes/`.
Implementation work should point to the governing OpenSpec artifact and the authoritative repo spec section when relevant.

## Documentation Standard

README updates must preserve the required section order from the spec. CLI help text must document purpose, inputs, flags, outputs, and next step behavior. Template annotations must explain what to write and what not to write when the field is easy to misuse.

## Quality Standards

TypeScript runs in strict mode. No `any`, no `@ts-ignore`, and no lint warnings. Deterministic domain logic requires exhaustive automated coverage.

## Pull Requests

Every pull request should include:

- the branch name and linked issue
- the governing OpenSpec spec or change proposal
- the relevant spec section reference
- test or validation evidence
- an example of changed output when user-facing behavior changes

Pull requests must not merge unless:

- business logic unit test coverage is 100%
- required status checks pass
- the implementation is aligned to spec
- review feedback is resolved

## Issues

Use the issue templates when possible so work lands in the project board and milestones cleanly. Link the spec section that governs the behavior you are proposing or changing.

## Coverage Gate

The repository enforces a high bar for core business logic. Scoring, prioritization, validation, and report generation must keep the required coverage floor and should not merge when a branch reduces trust in deterministic behavior.
For deterministic business logic, the merge gate is 100% unit test coverage.

## Public Repo Hygiene

Keep `README.md`, `SECURITY.md`, `.github/CODEOWNERS`, and `CITATION.cff` current whenever project behavior, scope, or support expectations change.
