# repo-governance Specification

## Purpose

Define the merge, branching, and specification rules that govern changes in this repository.

## Requirements

### Requirement: Changes use feature branches

The repository SHALL require implementation work to happen on a non-`main` branch.

#### Scenario: Starting work

- GIVEN a contributor needs to make a change
- WHEN they begin implementation
- THEN they use a proper branch rather than committing work directly to `main`

### Requirement: Main branch is protected

The repository SHALL protect `main` against direct pushes and direct merges.

#### Scenario: Attempting direct update

- GIVEN a contributor has local changes
- WHEN they try to update `main` directly
- THEN GitHub branch protection blocks the change unless it goes through the approved PR workflow

### Requirement: Specs govern implementation

The repository SHALL treat the governing spec as authoritative for implementation.

#### Scenario: Code drifts from spec

- GIVEN implementation behavior differs from the approved spec
- WHEN the change is reviewed
- THEN the pull request is rejected until the implementation or spec is corrected

#### Scenario: Multiple spec sources exist

- GIVEN an OpenSpec artifact and `ref/the-day-after-toolkit-spec.md` both describe the same behavior
- WHEN they disagree
- THEN `ref/the-day-after-toolkit-spec.md` wins until that area is explicitly migrated

### Requirement: OpenSpec is the planning layer

The repository SHALL store living specs and change proposals using the OpenSpec layout.

#### Scenario: New behavioral change

- GIVEN a contributor is introducing or changing behavior
- WHEN they define the work
- THEN they add or update the relevant OpenSpec spec or change proposal in-repo

### Requirement: Active work needs an execution signal

Accepted implementation issues SHALL show active execution within one working day.

#### Scenario: Ticket exists but no one is executing it

- GIVEN an open implementation issue exists
- AND the issue has no assignee
- AND the issue has no linked open pull request
- WHEN the issue remains in that state longer than the allowed grace period
- THEN repository automation flags it as stalled work
- AND maintainers correct the status before opening more implementation tickets

### Requirement: Business logic must be fully unit tested

The repository SHALL require deterministic business logic to reach 100% unit test coverage before merge.

#### Scenario: Coverage below threshold

- GIVEN a pull request changes scoring, prioritization, validation, or report-generation logic
- WHEN unit test coverage for that business logic is below 100%
- THEN the pull request does not merge once the repo coverage gate is wired into CI, and reviewers treat the gap as blocking until then
