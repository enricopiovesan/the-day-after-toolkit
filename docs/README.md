---
title: Docs Maintainer Notes
permalink: /docs/maintainers/
---

# Docs

The documentation set mirrors the toolkit spec and the book's appendix structure.

## Contents

- `concepts.md` defines the core nouns used across the repo.
- `adoption-journey.md` maps the two-path quick start and the full six-command loop.
- `cli-reference.md` documents command behavior, flags, and generated artifacts.
- `contract-schema-reference.md` explains the contract fields one by one.
- `legibility-audit-guide.md` and `extraction-priority-guide.md` mirror the book's appendices.
- `semver-for-contracts.md` summarizes how contract versioning works.
- `anti-patterns.md` calls out the common ways contracts drift from intent.
- `example-cdad-report.md` shows the shape of a real `cdad check` output.
- `launch-readiness-checklist.md` captures the last manual repo and release checks before public launch.

## Reading Order

If you are new to the toolkit, read in this order:

1. `concepts.md`
2. `adoption-journey.md`
3. `cli-reference.md`
4. `contract-schema-reference.md`

If you are maintaining an existing rollout, keep `anti-patterns.md`, `semver-for-contracts.md`, and `example-cdad-report.md` close at hand.

## Docs Site Workflow

The published docs site is built directly from the Markdown files in `docs/` using the GitHub Pages workflow at `.github/workflows/docs-site.yml`.

For local authoring:

1. edit the Markdown file under `docs/`
2. if you add a new page, add its frontmatter and navigation entry in `_data/docs_nav.yml`
3. preview locally with Jekyll if you have Ruby available:

```bash
bundle exec jekyll serve --source . --destination _site
```

For publishing:

1. merge the docs change to `main`
2. let the `Docs Site` workflow build and deploy the site
3. verify the updated page on GitHub Pages before announcing the change
