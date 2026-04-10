---
title: Adoption Journey
permalink: /docs/adoption-journey/
---

# Adoption Journey

The Day After Toolkit turns one diagnostic into a workflow. The path is `check` to `roadmap` to `init` to `validate` to `graph`, then back to `check` as the repo improves.

## The Six Stages

1. `cdad check` establishes the baseline by combining a static scan with the legibility questionnaire and writing `cdad-report.md`.
2. `cdad roadmap` reads that report, adds criticality and frequency, and ranks the capabilities that need extraction first.
3. `cdad init <capability-id>` scaffolds a contract triple for one capability in `cdad/[capability-id]/`.
4. `cdad validate <path>` checks the contract schema, versioning rules, and generated-artifact consistency before a PR merges.
5. `cdad graph` turns all discovered contracts into a dependency map for humans and agents.
6. `cdad check` runs again so the team can see whether the repo is becoming easier to navigate over time.

## Day One

Start with `cdad check` in the repository root, then move straight to `cdad roadmap` for the highest-risk capabilities. If a capability is clearly ready, scaffold it with `cdad init`; if not, use `cdad validate` and `cdad graph` to keep the work honest and visible.

## Phase Shape

Phase 1 is the foundation: the repo structure, schemas, templates, open source files, and CI all need to exist before the CLI can earn trust.
Phase 2 is the core CLI: `check`, `roadmap`, `init`, `validate`, and `graph`.
Phase 3 is polish: agent configs, docs completion, and the finishing passes that make the toolkit easy to share publicly.
