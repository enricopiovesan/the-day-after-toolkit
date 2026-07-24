// Prefixes a root-relative path (e.g. "/tribal-knowledge/") with the
// configured `base` from astro.config.mjs, so internal links and asset
// references keep working whether the site is served from "/" (a custom
// domain) or "/the-day-after-toolkit/" (a GitHub Pages project site).
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
