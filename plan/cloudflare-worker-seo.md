# SEO fix for video pages via Cloudflare Worker

## Context

Video URLs (`/v/<encoded>/<code>`) on the static-exported site hit GitHub Pages' `404.html`. This causes two problems:
1. **HTTP 404 status** — search engines and some browsers reject/warn on these pages
2. **No dynamic OG tags** — social sharing shows generic "OpenLoom" branding; `<meta name="robots" content="noindex"/>` is baked in by Next.js

Since the site uses `output: "export"` (fully static), there's no server to generate per-video metadata. A **Cloudflare Worker** sitting in front of GitHub Pages intercepts `/v/*` requests, fetches video metadata from the backend API, rewrites the HTML `<head>` via `HTMLRewriter`, and returns HTTP 200 with correct OG tags.

```
Browser/Crawler → Cloudflare Worker (openloom.live)
                    ├── /v/* → fetch 404.html from origin, rewrite OG tags, return 200
                    └── everything else → pass-through to GitHub Pages
```

## Files

| File | Action |
|------|--------|
| `worker/src/index.ts` | **Create** — main fetch handler: route detection, origin fetch, HTMLRewriter, caching |
| `worker/src/slug.ts` | **Create** — ported `decodeBase64Url`, `parseSlugParams`, `apiBaseUrl`, `buildVideoMetaUrl` |
| `worker/src/meta-rewriter.ts` | **Create** — HTMLRewriter handlers: replace OG/Twitter meta, `<title>`, strip `noindex` |
| `worker/wrangler.toml` | **Create** — Worker config (name, route, ORIGIN env var) |
| `worker/package.json` | **Create** — wrangler + @cloudflare/workers-types |
| `worker/tsconfig.json` | **Create** — TS config for Workers runtime |
| `webviewer/lib/api.ts` | **Edit** — extract `parseSlugParams` + `decodeBase64Url` (cherry-pick from `web-viewer-dynamic`) |
| `webviewer/app/v/[...slug]/ViewerClient.tsx` | **Edit** — import shared `parseSlugParams` instead of inline copy (cherry-pick from `web-viewer-dynamic`) |

`not-found.tsx` and `next.config.ts` on `main` stay **unchanged** — the SPA catch-all via `404.html` is still the mechanism; the Worker wraps it.

## Plan

### 1. Cherry-pick the `parseSlugParams` refactor from `web-viewer-dynamic` to `main`

Only the changes to `webviewer/lib/api.ts` (add `decodeBase64Url` + `parseSlugParams`) and `webviewer/app/v/[...slug]/ViewerClient.tsx` (use shared import, remove inline copy). **Not** the `page.tsx`, `not-found.tsx`, or `next.config.ts` changes.

### 2. Create `worker/` directory with Cloudflare Worker

#### `worker/src/slug.ts`
Port from `webviewer/lib/api.ts` (standalone copy — separate runtime):
- `VideoMeta` interface
- `decodeBase64Url(encoded)` — base64url → string
- `parseSlugParams(slugParts[])` — `[encoded, code]` → `{ projectId, code, provider }`
- `apiBaseUrl(provider, projectId)` — provider-specific API base URL
- `buildVideoMetaUrl(provider, projectId, code)` — full metadata endpoint URL

#### `worker/src/meta-rewriter.ts`
Three HTMLRewriter element handlers:
- **`meta` handler** — replace `content` on existing `og:*` and `twitter:*` tags; replace `description`; **remove** `<meta name="robots" content="noindex"/>`
- **`title` handler** — replace inner text with video title
- **`head` handler** (runs on `</head>`) — append any OG tags not found in the original HTML (e.g., `og:video`, `og:video:type`)

Tags to inject: `og:title`, `og:description`, `og:url`, `og:type=video.other`, `og:video` (storage_url), `og:video:type=video/mp4`, `twitter:title`, `twitter:description`, `twitter:card`

#### `worker/src/index.ts`
Fetch handler logic:
1. If path doesn't start with `/v/` → `fetch(originRequest)` passthrough
2. Parse slug → if invalid, passthrough
3. Fetch video metadata with **1-hour Cloudflare Cache API** caching
4. Fetch `${ORIGIN}/404.html` from GitHub Pages (avoids loop since ORIGIN points to raw GH Pages URL, not the proxied domain)
5. `new HTMLRewriter().on("meta", ...).on("title", ...).on("head", ...).transform(originResponse)`
6. Return with status 200
7. On any error → still serve `404.html` with 200 and default tags (graceful degradation)

#### `worker/wrangler.toml`
```toml
name = "openloom-seo"
main = "src/index.ts"
compatibility_date = "2024-12-01"
[vars]
ORIGIN = "https://<github-pages-origin>"
```

#### `worker/package.json`
Dev deps: `wrangler`, `@cloudflare/workers-types`, `typescript`
Scripts: `dev` (wrangler dev), `deploy` (wrangler deploy), `typecheck`

### 3. Add `.github/workflows/deploy-worker.yml`

Mirrors the existing `deploy-pages.yml` pattern:
- Triggers on push to `main` when `worker/**` changes
- `npm ci` in `worker/`, then `npx wrangler deploy`
- Requires `CLOUDFLARE_API_TOKEN` secret

## Key design decisions

- **Code duplication**: Slug parsing is ~40 lines duplicated between `webviewer/lib/api.ts` and `worker/src/slug.ts`. Intentional — separate runtimes, separate builds, and the logic is small and stable.
- **ORIGIN env var**: Must point to the raw GitHub Pages URL (e.g., `https://anenthg.github.io`) to avoid a fetch loop since `openloom.live` is proxied through Cloudflare.
- **Stripping `noindex`**: Next.js auto-injects `<meta name="robots" content="noindex"/>` into `404.html` — the Worker must remove this or crawlers will still ignore video pages.
- **Cache TTL**: 1 hour for metadata. Title changes take up to 1h to reflect in OG tags — acceptable for social sharing.

## Alternatives considered

| Approach | HTTP 200 | Dynamic OG | GH Pages compatible | Why not |
|----------|----------|------------|---------------------|---------|
| 404.html SPA trick | No | No | Yes | GH Pages returns 404 status; crawlers don't run JS |
| Prerender.io / Rendertron | Depends | Partial | No (needs proxy) | Deprecated by Google; still needs a proxy layer |
| Build-time static gen via webhook | Delayed | Yes | Yes | Multi-tenant auth, latency, git bloat, race conditions |
| `_redirects` file (Netlify) | Yes | No | No | Not available on GitHub Pages; no dynamic tags |
| oEmbed / OG proxy | No | Partial | Partial | Chicken-and-egg: crawlers need `<link>` tag in HTML first |
| **Cloudflare Worker (this plan)** | **Yes** | **Yes** | **Yes** | **Recommended** — free tier, ~150 lines, streaming rewrite |

## Verification

1. `cd worker && npm install && npx wrangler dev` — Worker starts locally
2. `curl -s http://localhost:8787/v/<valid-slug>/<code> | grep 'og:title'` — video-specific OG tags present
3. `curl -s http://localhost:8787/v/<valid-slug>/<code> | grep 'noindex'` — returns nothing (stripped)
4. `curl -s -o /dev/null -w '%{http_code}' http://localhost:8787/v/<valid-slug>/<code>` — returns `200`
5. `curl -s http://localhost:8787/pricing | grep 'og:title'` — shows default OpenLoom tags (passthrough)
6. `cd webviewer && npm run build` — static export still works after `parseSlugParams` refactor
7. After deploy: test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/), [Twitter Card Validator](https://cards-dev.twitter.com/validator)
