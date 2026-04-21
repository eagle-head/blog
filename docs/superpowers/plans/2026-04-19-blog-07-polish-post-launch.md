# Blog — Plan 07: Post-launch Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gaps between "v0 is live and working" and "v0 is professionally complete" — license file, apple/android icons, PWA-ready
manifest, security contact, RSS feed discovery, browser theme color, and getting the site indexed by the major search engines. Plus document
the v1+ roadmap so nothing gets lost.

**Architecture:** Each Phase 1 item is a small, independent file or `<meta>` tweak; order inside Phase 1 is alphabetical and not
load-bearing. Phase 2 is external (Google Search Console + Bing Webmaster Tools dashboards, no repo changes beyond adding a verification TXT
record to the CF DNS zone if needed). Phase 3 is documentation-only — captures the shape of deferred work.

**Tech Stack:** No new dependencies. Pure static files in `public/` and `<meta>` additions in `src/layouts/BaseLayout.astro`.

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md`

**Prerequisites:** Plan 06 complete (tag `v0.6.0-deploy`), site live at `https://eduardokohn.com`, CI green, DNS zone on Cloudflare with
Worker custom domain bound.

**Constraints:**

- Zero new runtime dependencies.
- Every change must pass `npm run check` + `npm test` + `npm run build` + the existing CSP.
- Nothing here needs coordination with external services beyond Phase 2 (search engines).

---

## Phase 1 — v0 Closeout Essentials

### Task 1.1 — LICENSE

**Files:**

- Create: `/home/eduardo/Documents/blog/LICENSE`

- [ ] **Step 1: Write MIT LICENSE**

```text
MIT License

Copyright (c) 2026 Eduardo Kohn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

MIT covers the **code** in the repo; written content (MDX, papers, posts) is out-of-scope and defaults to CC BY 4.0 per the README.

- [ ] **Step 2: Verify GitHub recognizes it**

```bash
git add LICENSE && git commit -m "docs(license): add MIT license for source code"
git push origin main
```

After push, open `https://github.com/eagle-head/blog` and confirm the repo header shows `MIT license` next to the star/fork counts — that
means GitHub's linguist detected it correctly.

---

### Task 1.2 — Apple touch icon

**Files:**

- Create: `/home/eduardo/Documents/blog/public/apple-touch-icon.png` (180×180 PNG)

- [ ] **Step 1: Generate from `favicon.svg`**

Since we already have `public/favicon.svg`, the simplest generator is to render it to PNG at 180×180. Any of these work:

```bash
# Option A: via rsvg-convert (apt install librsvg2-bin)
rsvg-convert -w 180 -h 180 public/favicon.svg > public/apple-touch-icon.png

# Option B: via inkscape (brew/apt install inkscape)
inkscape public/favicon.svg --export-width=180 --export-type=png --export-filename=public/apple-touch-icon.png

# Option C: online (if no CLI tool installed) — https://cloudconvert.com/svg-to-png
# Upload favicon.svg → set dimensions 180×180 → export → save as apple-touch-icon.png
```

- [ ] **Step 2: Verify dimensions**

```bash
file public/apple-touch-icon.png
```

Expected output contains `180 x 180`.

- [ ] **Step 3: Reference in `BaseLayout.astro`**

Open `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`. Immediately below the existing `<link rel="icon">`:

```astro
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

- [ ] **Step 4: Commit**

```bash
git add public/apple-touch-icon.png src/layouts/BaseLayout.astro
git commit -m "feat(icons): add apple-touch-icon for iOS home-screen bookmarks"
```

---

### Task 1.3 — Web app manifest

**Files:**

- Create: `/home/eduardo/Documents/blog/public/icon-192.png`
- Create: `/home/eduardo/Documents/blog/public/icon-512.png`
- Create: `/home/eduardo/Documents/blog/public/site.webmanifest`

- [ ] **Step 1: Generate the two PNG icons**

Same technique as Task 1.2 but at two sizes:

```bash
rsvg-convert -w 192 -h 192 public/favicon.svg > public/icon-192.png
rsvg-convert -w 512 -h 512 public/favicon.svg > public/icon-512.png
```

- [ ] **Step 2: Write the manifest**

```json
{
  "name": "Eduardo Kohn",
  "short_name": "Kohn",
  "description": "Computer science papers and posts — bilingual (EN + pt-BR).",
  "start_url": "/",
  "display": "minimal-ui",
  "background_color": "#ffffff",
  "theme_color": "#9d174d",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Reference in `BaseLayout.astro`**

Below the `apple-touch-icon` line:

```astro
<link rel="manifest" href="/site.webmanifest" />
```

- [ ] **Step 4: Commit**

```bash
git add public/icon-192.png public/icon-512.png public/site.webmanifest src/layouts/BaseLayout.astro
git commit -m "feat(pwa): add site.webmanifest + PNG icons at 192/512"
```

---

### Task 1.4 — Theme-color meta

Affects browser chrome on mobile (Safari address bar, Chrome Android notification bar). Two values — one per theme — so mobile follows
light/dark automatically.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add the two theme-color meta tags**

Below `<meta name="viewport">`:

```astro
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />
```

Values chosen to match the body background of each theme (not the accent), which is what mobile browsers expect for their chrome.

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(seo): theme-color meta per color scheme for mobile chrome"
```

---

### Task 1.5 — RSS feed discovery

Feeds exist at `/rss.xml`, `/papers.rss.xml`, `/posts.rss.xml` and their pt-BR mirrors, but none of them are advertised in the HTML head —
browsers and feed readers rely on `<link rel="alternate">` to auto-detect.

**Files:**

- Modify: `/home/eduardo/Documents/blog/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add RSS `<link>` tags per locale**

The layout already exposes `lang`. Use it to pick the locale-appropriate feed. Below the manifest line from Task 1.3:

```astro
<link rel="alternate" type="application/rss+xml" title="Eduardo Kohn — All" href={lang === 'pt-BR' ? '/pt-br/rss.xml' : '/rss.xml'} />
<link
  rel="alternate"
  type="application/rss+xml"
  title="Eduardo Kohn — Papers"
  href={lang === 'pt-BR' ? '/pt-br/papers.rss.xml' : '/papers.rss.xml'}
/>
<link
  rel="alternate"
  type="application/rss+xml"
  title="Eduardo Kohn — Posts"
  href={lang === 'pt-BR' ? '/pt-br/posts.rss.xml' : '/posts.rss.xml'}
/>
```

- [ ] **Step 2: Verify on build**

```bash
npm run build
grep -o '<link rel="alternate" type="application/rss' dist/index.html | wc -l
grep -o '<link rel="alternate" type="application/rss' dist/pt-br/index.html | wc -l
```

Both should print `3`.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(seo): advertise RSS feeds via <link rel=alternate>"
```

---

### Task 1.6 — security.txt

RFC 9116 — publicly declares how to report security issues. Even for a personal blog this signals professionalism and helps researchers
reach you.

**Files:**

- Create: `/home/eduardo/Documents/blog/public/.well-known/security.txt`

- [ ] **Step 1: Write the file**

Expires must be an ISO date ≤ one year in the future. Use `2027-04-19T00:00:00.000Z` (one year from now).

```text
Contact: mailto:eduardokohn15@gmail.com
Expires: 2027-04-19T00:00:00.000Z
Preferred-Languages: en, pt-BR
Canonical: https://eduardokohn.com/.well-known/security.txt
```

- [ ] **Step 2: Verify build output**

```bash
npm run build
cat dist/.well-known/security.txt
```

Expected: same content, `Contact:` on line 1.

- [ ] **Step 3: Commit**

```bash
git add public/.well-known/security.txt
git commit -m "feat(security): publish security.txt per RFC 9116"
```

- [ ] **Step 4: Renew reminder**

Set a calendar reminder for **2027-03-19** (one month before expiry) to rotate the `Expires` date. Without it, the file goes stale and
researchers may assume the contact is abandoned.

---

### Task 1.7 — End-of-Phase-1 smoke

**Files:** none (verification only).

- [ ] **Step 1: Full local CI**

```bash
npm run check && npm test && npm run build
```

All green.

- [ ] **Step 2: Confirm all assets reach `dist/`**

```bash
ls dist/apple-touch-icon.png dist/icon-192.png dist/icon-512.png dist/site.webmanifest dist/.well-known/security.txt
```

All five paths must exist.

- [ ] **Step 3: Push**

```bash
git push origin main
```

CF Workers Builds auto-redeploys. Wait for the deploy to propagate, then spot-check from the live domain:

```bash
curl -sI https://eduardokohn.com/apple-touch-icon.png | head -3
curl -s https://eduardokohn.com/site.webmanifest | head -5
curl -s https://eduardokohn.com/.well-known/security.txt | head -3
curl -s https://eduardokohn.com/ | grep -oE '<link rel="(alternate|manifest|apple-touch-icon)[^>]*>' | head
```

All four commands should return expected content. Last command should print the four new `<link>` tags plus the three RSS alternates.

---

## Phase 2 — Search Engine Onboarding

Both Google and Bing index public sites without any action, but submitting the sitemap triggers a crawl in hours instead of weeks. Both
require **ownership verification** before they let you submit a sitemap. DNS-based verification is the cleanest since the DNS is on
Cloudflare (same account), no temporary file juggling needed.

### Task 2.1 — Google Search Console

**Files:** none (external dashboard).

- [ ] **Step 1: Add the property**

1. Open `https://search.google.com/search-console` → **Add property**.
2. Pick the **Domain** property type (covers `https://`, `http://`, `www.`, and all subdomains in one record).
3. Enter `eduardokohn.com` → **Continue**.
4. Google shows a TXT record value like `google-site-verification=abc123...`. Copy it.

- [ ] **Step 2: Add the TXT record in Cloudflare**

1. Dashboard → zone `eduardokohn.com` → **DNS** → **Records** → **Add record**.
2. **Type:** `TXT`, **Name:** `@` (apex), **Content:** the full `google-site-verification=...` string from Google.
3. **Save**.

- [ ] **Step 3: Verify**

Back in Google Search Console, click **Verify**. Google reads the TXT record (propagates in <1min on CF DNS) and marks ownership verified.

- [ ] **Step 4: Submit the sitemap**

In Search Console → **Sitemaps** (left nav) → enter `sitemap-index.xml` → **Submit**.

Status should flip to **Success** within a few minutes. First crawl usually happens within 24h.

- [ ] **Step 5: Request indexing for the home page manually (optional)**

URL Inspection tool → paste `https://eduardokohn.com/` → **Request indexing**. This prioritizes the crawl for the apex; the rest cascades
from the sitemap + internal links.

---

### Task 2.2 — Bing Webmaster Tools

**Files:** none.

- [ ] **Step 1: Import from Google (fastest path)**

Bing Webmaster Tools offers a one-click import of verified properties from Google Search Console. Saves redoing the DNS verification.

1. Open `https://www.bing.com/webmasters/` → sign in with Microsoft account.
2. **Add a site** → **Import from Google Search Console** → authorize.
3. Pick `eduardokohn.com` → **Import**.

- [ ] **Step 2: Verify the sitemap imported**

Bing should pull the sitemap URL from Google automatically. If not:

1. Left nav → **Sitemaps** → **Submit sitemap** → `https://eduardokohn.com/sitemap-index.xml`.

- [ ] **Step 3: Enable IndexNow (nice-to-have)**

Bing supports the [IndexNow](https://www.indexnow.org/) protocol — push-based indexing instead of pull. Integration requires a small
endpoint at `/{key}.txt`. Skip for v0 unless organic-Bing traffic becomes meaningful.

---

## Phase 3 — v1+ Roadmap (Documentation Only)

These are captured here so they don't get lost, but none ship in this plan. Each gets its own future plan when we decide to do it.

### 3.1 — Nonce-based CSP

Remove `'unsafe-inline'` from `script-src` and `style-src`. Astro has an experimental `security.csp` option that hash-computes each inline
script/style at build time and emits them in the CSP header automatically. Non-trivial pipeline change; benefits are mostly defense-in-depth
rather than fixing a concrete exploit path.

Triggers for doing this: public disclosure of an XSS vector in the stack, or third-party audit requirement.

### 3.2 — Mermaid diagrams on Cloudflare Builds

Current config uses `rehype-mermaid` with `strategy: 'inline-svg'` which spawns a Chromium via Playwright at build time. Local builds work
because Playwright is a devDep and we have chromium installed. Cloudflare Workers Builds images don't include Chromium — so the first
`fenced mermaid block` added to an MDX file will fail the CF build.

Three remediation options, cheapest first:

1. Swap to `strategy: 'pre-mermaid'` in `astro.config.mjs` — renders diagrams client-side via the `mermaid` package (already a dep). Adds
   ~200KB of JS to pages that use mermaid. No build-time browser.
2. Prepend `npx playwright install --with-deps chromium` to the Cloudflare build command. Adds ~40s to every build.
3. Pre-render diagrams as SVG files and commit them — static `<img src>` in MDX. Most control, most manual work per diagram.

Trigger: first merged commit containing a mermaid code fence.

### 3.3 — Hero images in posts

`posts.heroImage` is already typed as `image().optional()` in the Zod schema but nothing in `PostLayout.astro` renders it. Scope: layout
tweak + image optimization pipeline already provided by Astro's `<Image>` component.

### 3.4 — Series/sequence UI

`posts.series = { id, order }` also exists in the schema, unrendered. Scope: a `SeriesNav` component under the post body that lists the
other parts of the series in order and highlights the current one.

### 3.5 — Lighthouse CI

Add `@lhci/cli` as a devDep and a `.lighthouserc.json`; extend `.github/workflows/ci.yml` with a `lighthouse` job that runs against
`npm run preview` and uploads a report. Fail the build if any of Performance/Accessibility/Best-Practices/SEO drop below a chosen threshold
(0.95 is reasonable for static sites).

### 3.6 — Uptime monitoring with alerts

Cloudflare's built-in Analytics show traffic but don't page you on outage. UptimeRobot (free tier: 50 monitors, 5-min interval) or
BetterUptime (free tier: 10 monitors) hit the apex every 5 min and alert to email/Slack if 200 drops to anything else. Setup: create an
HTTP(s) monitor pointing at `https://eduardokohn.com/`, optionally a second at `https://eduardokohn.com/pagefind/pagefind.js` to catch
search-index regressions.

### 3.7 — IndexNow endpoint

Follow-up to Task 2.2. Bing (and Yandex, Seznam) support IndexNow for push indexing. Implementation: a new page at `/<key>.txt` that serves
the key, plus a small post-build hook that POSTs the list of changed URLs to the IndexNow endpoint. Worth it if blog-post-publication
frequency ramps up.

---

## Phase 4 — Tag the release

### Task 4.1 — Tag v0.7.0-polish

- [ ] **Step 1: Clean tree**

```bash
git status
```

Expected: "nothing to commit, working tree clean."

- [ ] **Step 2: Tag and push**

```bash
git tag -a v0.7.0-polish -m "post-launch polish: LICENSE, PWA assets, RSS discovery, security.txt, theme-color"
git push origin v0.7.0-polish
```

- [ ] **Step 3: Summary**

```bash
git log --oneline -n 10 && echo "---" && git tag -n1 -l "v0.*"
```

---

## Out of scope (explicit non-goals)

- Content authoring (replacing samples, writing About/CV). Tracked separately; this plan is pure infra/meta.
- Setting up an IndexNow key (Phase 3.7) — documented only, not executed.
- Third-party SEO tools beyond Google/Bing (Yandex, Naver, Baidu). Audience doesn't justify.
