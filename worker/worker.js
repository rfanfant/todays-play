// Today's Play – Ticketmaster proxy (Cloudflare Worker)
//
// The page calls this Worker instead of Ticketmaster. The Worker adds the API key, which is
// stored as a Cloudflare secret named TM_KEY, so the key never reaches the browser or the app.
//
// It only forwards event searches, only for requests coming from the Today's Play site,
// and caches each answer for a few minutes so repeat searches don't use up the daily quota.

const ALLOWED_ORIGINS = [
  "https://rfanfant.github.io",
];
const TM_EVENTS = "https://app.ticketmaster.com/discovery/v2/events.json";
// Only these search parameters are passed through to Ticketmaster.
const ALLOWED_PARAMS = new Set([
  "classificationName", "localStartDateTime", "sort", "size",
  "geoPoint", "radius", "unit", "city", "stateCode", "postalCode",
]);
const CACHE_SECONDS = 600; // 10 minutes

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function reply(status, body, origin, extra = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(origin ? cors(origin) : {}), ...extra },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;

    if (request.method === "OPTIONS") {
      return allowed ? new Response(null, { status: 204, headers: cors(allowed) }) : new Response(null, { status: 403 });
    }
    if (request.method !== "GET" || url.pathname !== "/events") return reply(404, { error: "not found" }, allowed);
    if (!allowed) return reply(403, { error: "forbidden" }, null);
    if (!env.TM_KEY) return reply(500, { error: "server not configured" }, allowed);

    // Build the Ticketmaster request from the allowed parameters only.
    const tm = new URL(TM_EVENTS);
    for (const [k, v] of url.searchParams) if (ALLOWED_PARAMS.has(k)) tm.searchParams.set(k, v);
    const size = Number(tm.searchParams.get("size") || 20);
    if (!(size > 0 && size <= 100)) tm.searchParams.set("size", "100");

    // Cache key: the request without the key, sorted so equivalent searches share an entry.
    tm.searchParams.sort();
    const cacheKey = new Request(`https://cache.todays-play/${tm.search}`);
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) return reply(200, await hit.text(), allowed, { "X-Cache": "HIT" });

    tm.searchParams.set("apikey", env.TM_KEY);
    let res;
    try { res = await fetch(tm.toString(), { headers: { Accept: "application/json" } }); }
    catch { return reply(502, { error: "ticketmaster unreachable" }, allowed); }

    const text = await res.text();
    if (res.ok) {
      ctx.waitUntil(cache.put(cacheKey, new Response(text, {
        headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
      })));
    }
    // Ticketmaster's own error codes (401 bad key, 429 over quota) are passed through.
    return reply(res.status, text, allowed, { "X-Cache": "MISS" });
  },
};
