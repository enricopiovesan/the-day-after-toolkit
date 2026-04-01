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

### Requirement: OpenSpec is the planning layer

The repository SHALL store living specs and change proposals using the OpenSpec layout.

#### Scenario: New behavioral change

- GIVEN a contributor is introducing or changing behavior
- WHEN they define the work
- THEN they add or update the relevant OpenSpec spec or change proposal in-repo

### Requirement: Business logic must be fully unit tested

The repository SHALL reject pull requests when deterministic business logic does not have 100% unit test coverage.

#### Scenario: Coverage below threshold

- GIVEN a pull request changes scoring, prioritization, validation, or report-generation logic
- WHEN unit test coverage for that business logic is below 100%
- THEN the pull request does not merge
