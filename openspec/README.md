# OpenSpec

This repository uses [OpenSpec](https://openspec.dev/) as the planning and specification workflow for changes that affect behavior, requirements, or operating rules.

## Layout

- `openspec/specs/` holds the living specs for capabilities and repo-level rules
- `openspec/changes/` holds proposed changes, design notes, and implementation tasks

## Rules

- Specs live in the repo and are reviewed with code
- No implementation should merge when it is not aligned to its governing spec
- PRs should reference the relevant spec or OpenSpec change proposal
- Business logic changes must include unit tests that keep coverage at 100%
