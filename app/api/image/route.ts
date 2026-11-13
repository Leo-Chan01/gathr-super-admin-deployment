import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Serves `http://` images over HTTPS so they are not blocked as mixed content.
// Only plain-http public hosts are proxied, and only image responses are
// passed through, so this cannot be used to reach internal services or to
// relay arbitrary content.

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

const isPrivateAddress = (address: string): boolean => {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a === "::" || a === "::1") return true;
    if (a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80"))
      return true;
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
};

/** Rejects anything but public http(s) hosts, including names that resolve privately. */
const isAllowedTarget = async (url: URL): Promise<boolean> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  try {
    const addresses = isIP(host)
      ? [{ address: host }]
      : await lookup(host, { all: true });
    return (
      addresses.length > 0 &&
      addresses.every(({ address }) => !isPrivateAddress(address))
    );
  } catch {
    return false;
  }
};

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (target.protocol !== "http:") {
    return new Response("Only http:// images are proxied", { status: 400 });
  }

  let upstream: Response | undefined;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isAllowedTarget(target))) {
      return new Response("Host not allowed", { status: 403 });
    }
    try {
      upstream = await fetch(target, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: "image/*" },
      });
    } catch {
      return new Response("Upstream fetch failed", { status: 502 });
    }
    const location = upstream.headers.get("location");
    if (upstream.status >= 300 && upstream.status < 400 && location) {
      target = new URL(location, target);
      upstream = undefined;
      continue;
    }
    break;
  }

  if (!upstream) return new Response("Too many redirects", { status: 508 });
  if (!upstream.ok || !upstream.body) {
    return new Response("Image not found", { status: upstream.status || 502 });
  }

  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    return new Response("Not an image", { status: 415 });
  }
  const length = Number(upstream.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return new Response("Image too large", { status: 413 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      ...(length ? { "Content-Length": String(length) } : {}),
      // Let the browser and the Vercel CDN keep it for a day.
      "Cache-Control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
      // SVGs can carry script; keep them inert if opened directly.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
