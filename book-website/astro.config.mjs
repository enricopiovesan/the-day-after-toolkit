// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from the custom domain at the site root, so no `base` path.
// All internal links/assets still go through src/utils/url.ts's
// withBase(), which is a no-op once `base` is unset.
// https://astro.build/config
export default defineConfig({
  site: 'https://thedayafteraibook.com',
  redirects: {
    '/contract-lifecycle': '/making-your-system-legible/',
    '/appendix/contract-schema-reference': '/appendix/',
    '/appendix/legibility-audit-framework': '/appendix/agent-onboarding-test/',
    '/appendix/extraction-priority-matrix': '/appendix/',
  },
  integrations: [
    sitemap({
      lastmod: new Date(),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
});
