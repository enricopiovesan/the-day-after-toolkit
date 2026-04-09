# Contributing

The Day After Toolkit turns the book's argument into executable open source tooling. Contributions matter because the repo has to work for first-time practitioners, not only readers who already know the model.

## Branching Rule

Never commit working changes directly to `main`. Every change starts on a proper branch, opens a pull request, and lands through review.
If an issue is accepted for implementation, it must be assigned, moved into active execution, and have a pull request opened promptly. Open issues must not sit indefinitely with no execution owner and no branch-backed PR.

## Before You Start

Please read:

- [README.md](README.md)
- [ref/the-day-after-toolkit-spec.md](ref/the-day-after-toolkit-spec.md)
- the reference material in `ref/`
- [openspec/README.md](openspec/README.md)

## Acceptance Bar

Before a pull request merges, it must pass the required build, lint, test, schema validation, and contract validation checks.
Deterministic business logic is expected to maintain 100% unit test coverage.
Implementation must stay aligned to the governing spec.
Contributors should run `npm run validate-schemas` after editing files under `schemas/` and `npm run generate-examples -- --check` after editing worked-example YAML or generated artifacts under `templates/worked-examples/`.

## The Contract for This Repo

This repo must be useful to a first-time practitioner. Changes that break the reader or practitioner path are rejected even if the code is otherwise clean.
The implementation must stay aligned to the authoritative spec for the change. If code and spec disagree, fix the spec first or do not merge the code.

## Spec Workflow

Use [OpenSpec](https://openspec.dev/) to define and evolve specs in this repository.
Specs live in `openspec/specs/` and change proposals live in `openspec/changes/`.
Implementation work should point to the governing OpenSpec artifact and the authoritative repo spec section when relevant.
When an OpenSpec artifact and `ref/the-day-after-toolkit-spec.md` both cover the same behavior, `ref/the-day-after-toolkit-spec.md` is authoritative until the repo explicitly migrates that area into OpenSpec.

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

- required status checks pass
- business logic unit coverage requirements for the affected area are satisfied
- the implementation is aligned to the governing spec
- review feedback is resolved

## Issue Execution Rule

Once an issue is approved for implementation, it needs an execution signal within one working day. The minimum acceptable signal is one of:

- an assignee who owns execution
- an open pull request linked to the issue

If none of those signals exists, the issue is treated as stalled planning work and must be corrected before more tickets are opened.

## Project Statuses

Use the project `Status` field deliberately. Avoid leaving executable work in `Todo` when the next state is already known.

- `Ready` means the ticket has a governing spec reference, definition of done, and no known blocker. It is ready to be picked up for implementation.
- `In Progress` means one owner is actively executing the ticket and driving its linked branch or pull request.
- `Blocked` means work cannot move forward because of a concrete dependency, decision, or failing external condition. The blocking reason should be written in the issue or PR.
- `Done` means the linked implementation has merged or the ticket has been otherwise fully resolved.

Implementation tickets should normally move through `Ready` → `In Progress` → `Done`.
Use `Blocked` instead of letting a ticket or PR silently stall.

## Issues

Use the issue templates when possible so work lands in the project board and milestones cleanly. Link the spec section that governs the behavior you are proposing or changing.

## Coverage Gate

The repository enforces a high bar for core business logic. Scoring, prioritization, validation, and report generation must keep the required coverage floor and should not merge when a branch reduces trust in deterministic behavior.
For deterministic business logic, the target merge gate is 100% unit test coverage. Until CI enforces this mechanically, reviewers must treat it as a blocking requirement.

## Public Repo Hygiene

Keep `README.md`, `SECURITY.md`, `.github/CODEOWNERS`, and `CITATION.cff` current whenever project behavior, scope, or support expectations change.
