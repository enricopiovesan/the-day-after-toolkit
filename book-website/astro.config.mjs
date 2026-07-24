// @ts-check
import { defineConfig } from 'astro/config';

// Deployed as a GitHub Pages *project* site (this repo isn't named
// <user>.github.io), so it's served from /the-day-after-toolkit/, not
// from "/". All internal links/assets go through src/utils/url.ts's
// withBase() to stay correct here. If a custom domain is added later,
// drop `base` and withBase() becomes a no-op automatically.
// https://astro.build/config
export default defineConfig({
  site: 'https://enricopiovesan.github.io',
  base: '/the-day-after-toolkit/',
});
