/**
 * Edge caching for catalog responses that depend on the query string (filters, search terms).
 * Netlify's CDN ignores the query string in its cache key unless told otherwise, which would
 * serve the first cached result for every filter or search: `Netlify-Vary: query` keys the
 * cache on the full query.
 */
export const CATALOG_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Netlify-Vary": "query",
} as const;
