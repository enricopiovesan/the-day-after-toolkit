# Product

<!-- impeccable:product-schema 1 -->

<!-- Facts below are inferred from the repo's own content (README.md,
about-the-book.astro, siteSections.ts, author.astro) rather than a live
interview, per user approval on 2026-07-31. -->

## Platform

web

## Users

Software professionals evaluating whether to read *The Day After AI*:
architects, developers, product managers/POs, designers, and engineering
leadership at companies adopting AI coding agents. The site's own IA names
these personas explicitly (`/for-architects/`, `/for-developers/`,
`/for-product-managers/`, `/for-designers/`, `/for-engineering-leaders/`).
Secondary audience: AI agents and agent builders (`/for-ai-agents/` section
targets contract-authoring/reviewing/auditing agent personas directly).

## Product Purpose

Marketing/companion site for the book *The Day After AI: Making Software
Companies Legible to AI Agents* by Enrico Piovesan. Static Astro site, no
backend. Purpose: explain the book's thesis (tribal knowledge is what
breaks AI coding agents; contracts, not more documentation, are the
structural fix), let visitors read a free excerpt, and drive pre-orders.

## Positioning

Argues that "Contract-Driven AI Development" (C-DAD) is the structural fix
for AI-agent-illegible codebases, as opposed to competing approaches the
site explicitly differentiates against in its own `/comparisons/` section
(documentation, code comments, OpenAPI, ADRs, full rewrites).

## Operating Context

Static site, deployed to GitHub Pages at a custom domain
(thedayafteraibook.com), built and deployed via GitHub Actions on push to
`main`. Deep content hierarchy: ~90 pages across chapters, glossary, core
model, comparisons, use cases, and per-persona "for AI agents" pages, all
routed through a shared `SubpageLayout` with section nav + breadcrumbs +
on-page TOC.

## Capabilities and Constraints

- No backend: contact form, newsletter signup, and buy links are currently
  placeholders (`href="#"` / `hello@example.com`), documented as pre-launch
  TODOs in `book-website/README.md`.
- Every internal link/asset must go through `withBase()` (`src/utils/url.ts`)
  because the site can be deployed under a `/the-day-after-toolkit/` base
  path or a bare custom domain depending on GitHub Pages routing.
- Some "who is this for" team photos are low-res stock placeholders pending
  real photography (noted in README).

## Evidence on Hand

Real manuscript excerpts back the chapter-summary copy on the homepage and
chapter landing pages (non-spoiler, per an in-code comment in `index.astro`).
No reader testimonials exist yet (`index.astro` pull-quote is from the book
itself, not a reader). Visual design ports an existing Figma file
("the-day-after") per `book-website/README.md`.

## Product Principles

- Content is drawn from the real manuscript, not invented marketing copy —
  preserve that distinction when editing page text.
- The site's core value is structural legibility for both human personas
  and AI-agent personas; both audiences get dedicated navigation sections.
- Deep IA (many short, cross-linked pages) over long single pages — new
  content should extend `siteSections.ts`, not get bolted onto an existing
  page.

## Accessibility & Inclusion

WCAG AA (confirmed default; no stricter project-specific requirement
known).
