# The Day After AI — Book Website

Marketing site for *The Day After AI: Making Software Companies Legible to
AI Agents* by Enrico Piovesan. Built with [Astro](https://astro.build),
static output, no backend. Visual design ports the Figma file
["the-day-after"](https://www.figma.com/design/n1XQ7rXluWEvsJ2Zwu61OO/the-day-after).

## Structure

```text
book-website/
├── src/
│   ├── components/   Header, Footer, BuyLinks, SectionHeading,
│   │                 PanelSection, CardRow, AudienceGrid
│   ├── layouts/      BaseLayout (head, nav, footer, fonts)
│   ├── pages/        index, about-the-book, author, excerpt, contact
│   └── styles/       global.css (design tokens, light/dark)
└── public/
    └── images/        hero + "who is this for" team photos
```

## Commands

Run from `book-website/`:

| Command           | Action                                       |
| :----------------- | :-------------------------------------------- |
| `npm install`       | Install dependencies                          |
| `npm run dev`       | Start dev server at `localhost:4321`          |
| `npm run build`     | Build production site to `./dist/`            |
| `npm run preview`   | Preview the production build locally          |

## Before launch — TODOs left in the code

Search the codebase for `TODO` to find every placeholder:

- **Buy links** — `src/components/BuyLinks.astro` and the header's "Pre-order on Amazon" link (`src/components/Header.astro`) have `href="#"` placeholders.
- **Contact email** — `src/pages/contact.astro` (`hello@example.com` placeholder).
- **Newsletter signup** — no form-handling service is wired up yet (this is a static site with no backend); pick one (Mailchimp, ConvertKit, Buttondown, Formspree, etc.) before advertising it.
- **Photos** — `public/images/` was exported directly from the Figma file's stock placeholders (hero landscape + 6 "who is this book for" portraits). Three of the team photos (`team-project-managers.jpg`, `team-leadership.jpg`, `team-engineering-managers.jpg`) are low-resolution crops (~250–390px wide) — replace all of these with real or licensed photography before launch.

Body copy, the synopsis/table of contents, the sample chapter, and the four
chapter landing pages (`/tribal-knowledge/`, `/contracts/`,
`/capabilities-graph/`, `/extraction-over-refactoring/`) are drawn from the
real manuscript, kept to non-spoiler summaries.

## Deployment

Live at **https://thedayafteraibook.com**.

A GitHub Actions workflow at `.github/workflows/book-website-deploy.yml`
builds this site and deploys it to GitHub Pages on every push to `main`
that touches `book-website/**`. `astro.config.mjs` sets `site` and `base`
for this deployment; every internal link and asset reference goes through
`src/utils/url.ts`'s `withBase()` helper so they resolve correctly under
the `/the-day-after-toolkit/` path — use it for any new internal
`href`/`src` rather than a bare `/...` string.

**Note:** GitHub Pages serves only one site per repository. If this repo's
GitHub Pages is later used for the toolkit's own docs site (see issue #44),
it will conflict with this deployment. Options if that happens: put the
book site on a custom domain (drop `base` in `astro.config.mjs` — every
link already routes through `withBase()`, so that's the only change
needed), or move `book-website/` to its own repository.
