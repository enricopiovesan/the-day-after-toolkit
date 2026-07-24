// @ts-check
import { defineConfig } from 'astro/config';

// TODO before first deploy:
// - Set `site` to the real deployed origin (e.g. a custom domain, or
//   https://<user>.github.io for a GitHub Pages user/org site).
// - If deploying as a GitHub Pages *project* site with no custom domain,
//   GitHub serves it from /<repo-name>/, not from `/`. In that case also
//   set `base: '/<repo-name>/'` below and prefix internal links with
//   `import.meta.env.BASE_URL` (see src/components/Header.astro).
//   With a custom domain (or Vercel/Netlify), leave `base` unset.
// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
});
