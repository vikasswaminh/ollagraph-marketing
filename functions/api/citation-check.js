// Cloudflare Pages Function — POST /api/citation-check
//
// Production backend for the free AI Citation-Readiness Checker
// (/tools/citation-readiness). This is the ONLY place the server-side API key
// is touched — the browser never sees it. Because each uncached run spends one
// credit, the endpoint is defended in depth:
//
//   1. Origin allowlist          — stops other sites burning our credits via fetch()
//   2. SSRF-safe URL validation  — http(s) + public host only, before we spend anything
//   3. Per-IP soft rate limit    — fixed window via the edge Cache API
//   4. Result cache (10 min)     — identical URLs don't re-bill
//   5. Bounded dedicated key     — OLLAGRAPH_TOOL_KEY is a capped service key, so the
//                                  absolute spend ceiling is its balance / daily cap
//   6. Graceful fallback         — ANY failure (including "no key configured") returns
//                                  { ok:false, fallback:true, signupUrl } and the page
//                                  falls back to the signup deep-link. Safe to deploy
//                                  before the secret exists.

const API = "https://api.ollagraph.com/v1/aeo/citation-readiness";

const ALLOWED_ORIGINS = new Set([
  "https://ollagraph.com",
  "https://www.ollagraph.com",
]);
// Immutable Pages preview deploys: <hash>.ollagraph-marketing.pages.dev
const ALLOW_ORIGIN_RE = /^https:\/\/[a-z0-9-]+\.ollagraph-marketing\.pages\.dev$/i;

const RL_MAX = 6;             // max requests
const RL_WINDOW = 60;         // per this many seconds, per IP
const RESULT_TTL = 600;       // cache a URL's score for 10 minutes
const UPSTREAM_TIMEOUT_MS = 22000;

const SIGNUP =
  "https://app.ollagraph.com/signup?utm_source=ollagraph&utm_medium=free-tool&utm_campaign=citation-readiness&tool=citation-readiness";

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

function originAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin) || ALLOW_ORIGIN_RE.test(origin);
}

// Reject obviously-internal / non-public targets before spending a credit.
// (The API has its own url_guard; this is defense-in-depth and saves the call.)
function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (!host) return null;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return null;
  if (host.includes(":")) return null;            // IPv6 literal — skip
  if (host.indexOf(".") === -1) return null;       // no dot → not a public FQDN
  // Literal IPv4 → block private / loopback / link-local / multicast ranges.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const p = host.split(".").map(Number);
    if (p.some((n) => n > 255)) return null;
    if (p[0] === 0 || p[0] === 10 || p[0] === 127) return null;
    if (p[0] === 169 && p[1] === 254) return null;
    if (p[0] === 192 && p[1] === 168) return null;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return null;
    if (p[0] >= 224) return null;
  }
  return u.toString();
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") ||
         (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
         "0.0.0.0";
}

// Best-effort fixed-window counter in the edge cache. Not strictly atomic — the
// hard ceiling is the bounded key — but enough to stop one IP from hammering it.
async function softRateLimit(ip) {
  const cache = caches.default;
  const bucket = Math.floor(Date.now() / 1000 / RL_WINDOW);
  const key = new Request(`https://rl.ollagraph.internal/cr/${ip}/${bucket}`);
  let count = 0;
  const hit = await cache.match(key);
  if (hit) { try { count = parseInt(await hit.text(), 10) || 0; } catch {} }
  if (count >= RL_MAX) return false;
  await cache.put(key, new Response(String(count + 1), { headers: { "cache-control": `max-age=${RL_WINDOW}` } }));
  return true;
}

// Headline sub-scores we surface in the free result (full signals + the rest of
// the recommendations are gated behind signup).
const SIGNAL_LABELS = {
  numerical_specifics_max20: ["Numerical specifics", 20],
  named_entities_max20: ["Named entities", 20],
  authoritative_outbound_links_max25: ["Authoritative outbound links", 25],
  author_byline_max15: ["Author byline", 15],
  last_updated_max10: ["Last-updated date", 10],
  content_length_max10: ["Content depth", 10],
};

function toPartial(data) {
  const bd = data.score_breakdown || {};
  const breakdown = Object.keys(SIGNAL_LABELS).map((k) => ({
    label: SIGNAL_LABELS[k][0], max: SIGNAL_LABELS[k][1], score: bd[k] != null ? bd[k] : 0,
  }));
  const recs = Array.isArray(data.recommendations) ? data.recommendations : [];
  return {
    ok: true,
    score: data.score,
    grade: data.grade,
    finalUrl: data.final_url || data.url,
    botBlocked: !!data.bot_blocked_at_origin,
    breakdown,
    topRecommendation: recs[0] || null,
    recommendationCount: recs.length,
  };
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return json({ ok: false, error: "forbidden_origin" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
  const clean = validateUrl(((body && body.url) || "").trim());
  if (!clean) return json({ ok: false, error: "invalid_url" }, 400);

  const signupUrl = SIGNUP + "&url=" + encodeURIComponent(clean);

  // No key configured → graceful fallback so the page deep-links to signup.
  const key = env.OLLAGRAPH_TOOL_KEY;
  if (!key) return json({ ok: false, fallback: true, signupUrl });

  if (!(await softRateLimit(clientIp(request)))) {
    return json({ ok: false, error: "rate_limited", signupUrl }, 429, { "retry-after": String(RL_WINDOW) });
  }

  // Per-URL result cache — identical checks within the TTL don't re-bill.
  const cache = caches.default;
  const cacheKey = new Request("https://cache.ollagraph.internal/cr?u=" + encodeURIComponent(clean));
  const cached = await cache.match(cacheKey);
  if (cached) {
    const c = await cached.json();
    return json({ ...c, cached: true, signupUrl });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  let data;
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${key}`,
        "content-type": "application/json",
        "user-agent": "ollagraph-free-tool/1.0",
      },
      body: JSON.stringify({ url: clean }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      // 402 out-of-credits, 429, 5xx → fall back to signup gracefully.
      return json({ ok: false, fallback: true, status: r.status, signupUrl });
    }
    data = await r.json();
  } catch (e) {
    return json({ ok: false, fallback: true, error: "upstream_unreachable", signupUrl });
  } finally {
    clearTimeout(timer);
  }

  if (!data || data.status === "error") {
    // The target page itself couldn't be fetched/scored (bot-blocked, 404, …).
    const detail = (data && (data.detail || data.error)) || "could_not_score";
    return json({ ok: false, pageError: true, detail, signupUrl });
  }

  const partial = toPartial(data);
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(partial), { headers: { "cache-control": `max-age=${RESULT_TTL}` } }),
  );
  return json({ ...partial, signupUrl });
}

// Same-origin POSTs from the page don't preflight, but answer OPTIONS anyway.
export function onRequestOptions({ request }) {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}
