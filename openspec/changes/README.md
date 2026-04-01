# OpenSpec Changes

This directory holds proposed changes, design notes, and implementation task breakdowns for OpenSpec-managed work.

## Suggested Layout

Create one directory per change:

```text
openspec/changes/<change-id>/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    └── <capability-or-area>/
        └── spec.md
```

## Minimum Expectation

- `proposal.md` explains the change and why it is needed
- `tasks.md` breaks the work into reviewable implementation steps
- `design.md` is optional unless the change has non-obvious technical tradeoffs
- `specs/` contains the proposed spec deltas when behavior is changing
