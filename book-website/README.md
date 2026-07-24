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

- **Body copy** — every section on the homepage (`src/pages/index.astro`) still carries the Lorem ipsum and "Sub Title 1" / "New Title" placeholder labels from the Figma design. Replace before launch.
- **Buy links** — `src/components/BuyLinks.astro` and the header's "Pre-order on Amazon" link (`src/components/Header.astro`) have `href="#"` placeholders.
- **Book synopsis & table of contents** — `src/pages/about-the-book.astro`.
- **Sample chapter text** — `src/pages/excerpt.astro`.
- **Contact email** — `src/pages/contact.astro` (`hello@example.com` placeholder).
- **Newsletter signup** — no form-handling service is wired up yet (this is a static site with no backend); pick one (Mailchimp, ConvertKit, Buttondown, Formspree, etc.) before advertising it.
- **Photos** — `public/images/` was exported directly from the Figma file's stock placeholders (hero landscape + 6 "who is this book for" portraits). Two of the team photos (`team-project-managers.jpg`, `team-leadership.jpg`, `team-engineering-managers.jpg`) are low-resolution crops (~250–390px wide) — replace all of these with real or licensed photography before launch.
- **CTA section** — the coral "Get the book" block at the bottom of the homepage was an empty color panel in the Figma design; the current heading/buttons are a reasonable placeholder, not final copy.
- **`site` / `base` in `astro.config.mjs`** — set `site` to the real deployed origin. Only set `base` if deploying as a GitHub Pages *project* site without a custom domain (see comments in the file); if you do, also prefix the nav links in `src/components/Header.astro` with `import.meta.env.BASE_URL`.

## Deployment

A GitHub Actions workflow at `.github/workflows/book-website-deploy.yml`
builds this site and deploys it to GitHub Pages on every push to `main`
that touches `book-website/**`. To enable it:

1. In the repo's GitHub Settings → Pages, set the source to "GitHub Actions".
2. Set `site` (and `base`, if needed) in `astro.config.mjs` as described above.

**Note:** GitHub Pages serves only one site per repository. If this repo's
GitHub Pages is later used for the toolkit's own docs site (see issue #44),
it will conflict with deploying the book site the same way from this repo.
Options if that happens: put the book site on a custom domain (works
regardless of where Pages points), or move `book-website/` to its own
repository.
