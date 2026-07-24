// @ts-check
import { defineConfig } from 'astro/config';

// Served from the custom domain at the site root, so no `base` path.
// All internal links/assets still go through src/utils/url.ts's
// withBase(), which is a no-op once `base` is unset.
// https://astro.build/config
export default defineConfig({
  site: 'https://thedayafteraibook.com',
});
