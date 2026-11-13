/**
 * Normalises an image URL from the API so it loads on an HTTPS deployment.
 *
 * Browsers block (or force-upgrade) `http://` images on an `https://` page as
 * mixed content, so any host without HTTPS shows a broken image on Vercel even
 * though it works on `http://localhost`. Those URLs are routed through
 * `/api/image` (see app/api/image/route.ts), which fetches them server-side
 * and serves them back over HTTPS.
 */
export function imageSrc(url: string): string;
export function imageSrc(url: string | null | undefined): string | undefined;
export function imageSrc(url: string | null | undefined): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  // Protocol-relative URLs inherit the page protocol; pin them to HTTPS.
  if (value.startsWith("//")) return `https:${value}`;
  if (/^http:\/\//i.test(value)) {
    return `/api/image?url=${encodeURIComponent(value)}`;
  }
  // https:, data:, blob: and same-origin paths load fine as-is.
  return value;
}
