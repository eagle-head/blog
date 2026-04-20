# Blog — Plan 06: CI + Cloudflare Pages Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the last piece of the v0 blog — continuous integration via GitHub Actions and a reproducible Cloudflare Pages deploy with the
custom domain `kohn.dev`, security headers, and a documented runbook so the human partner can complete the one-time dashboard steps
unassisted.

**Architecture:** CI is a single GitHub Actions workflow at `.github/workflows/ci.yml` that runs on every PR and every push to `main`; it
installs from a pinned Node version, then runs `npm run check`, `npm test`, and `npm run build` in parallel-safe order. Node version is
pinned once in `.nvmrc` and read by both CI and Cloudflare Pages (via the `NODE_VERSION` environment variable in the CF dashboard, pointing
at the same file contents). Cloudflare Pages pulls directly from GitHub with no in-repo config beyond `public/_headers` (security headers)
and `public/_redirects` (defensive trailing-slash normalization). All one-time dashboard configuration is captured in `DEPLOY.md`.

**Tech Stack:** GitHub Actions (free for public repos), Cloudflare Pages (direct GitHub integration — no Wrangler needed for the static
pipeline), Node 22.12.x.

**Reference specs:**

- Architecture: `docs/superpowers/specs/2026-04-19-eduardokohn-blog-design.md`
- Visual design brief: `docs/superpowers/specs/2026-04-19-visual-design.md`

**Prerequisites:** Plan 05 complete (tag `v0.5.0-islands`). Working tree clean. GitHub repository already exists at `eagle-head/blog`
(public). User has a Cloudflare account and owns the `kohn.dev` domain (DNS at Cloudflare or delegable to Cloudflare).

**Constraints (from the brief):**

- Zero-cost hosting path: Cloudflare Pages free tier.
- No secrets in the repo: `PUBLIC_*` env vars live in the CF dashboard and `.env.example`; the `PUBLIC_` prefix is part of Astro's
  build-time public env convention and the values aren't secret.
- CI must fail fast on any of: typecheck, markdown lint, unit tests, build.
- Build reproducibility: identical Node version across local / CI / production.

---

## File Structure

New files:

- `.nvmrc` — single line, Node version (matches `package.json#engines.node`).
- `.github/workflows/ci.yml` — CI workflow (one job, five steps).
- `public/_headers` — Cloudflare Pages security headers (CSP, Referrer, Permissions, X-Frame-Options).
- `public/_redirects` — trailing-slash normalization fallback (Astro's `trailingSlash: 'never'` already handles this, but belt-and-braces
  prevents double redirects from any CF edge rule).
- `DEPLOY.md` — one-time Cloudflare dashboard runbook: project creation, build command, env vars, custom domain, DNS.

Modified files:

- `README.md` — add a "Deploy" section pointing at `DEPLOY.md` and documenting the CI badge.

---

## Phase 1 — GitHub Actions CI

### Task 1.1 — Pin Node version

**Files:**

- Create: `/home/eduardo/Documents/blog/.nvmrc`

- [ ] **Step 1: Write `.nvmrc`**

Create the file with a single line holding the exact Node LTS that matches `package.json#engines.node (">=22.12.0")`. Use `22.12.0` (a
concrete 22.x LTS release) so local `nvm use` + CI + Cloudflare Pages all agree.

```text
22.12.0
```

- [ ] **Step 2: Verify locally**

```bash
node -v
```

Expected: starts with `v22.` (anything `v22.12.0` or newer). If `nvm` is installed:

```bash
nvm use
```

Expected: `Now using node v22.12.0 (npm v...)`.

- [ ] **Step 3: Commit**

```bash
git add .nvmrc
git commit -m "chore(tooling): pin node 22.12.0 via .nvmrc"
```

---

### Task 1.2 — CI workflow

**Files:**

- Create: `/home/eduardo/Documents/blog/.github/workflows/ci.yml`

- [ ] **Step 1: Verify directory exists or create it**

```bash
mkdir -p .github/workflows
```

Expected: no output; the directory is now present.

- [ ] **Step 2: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Avoid concurrent runs for the same ref eating the macOS/Linux minutes; the
# latest push is what matters.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  verify:
    name: Lint · Typecheck · Test · Build
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint · Markdown
        run: npm run lint:md

      - name: Format check
        run: npm run format:check

      - name: Typecheck (astro sync + astro check)
        run: npm run check

      - name: Unit tests
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add github actions workflow (lint, typecheck, test, build)"
```

- [ ] **Step 4: Push and verify**

```bash
git push origin main
```

After push, open `https://github.com/eagle-head/blog/actions` and confirm the `CI` workflow ran on the push commit and is green. If the run
is red, fix the failing step locally (the same `npm` commands are available), recommit, repush.

---

### Task 1.3 — CI badge in README

**Files:**

- Modify: `/home/eduardo/Documents/blog/README.md`

- [ ] **Step 1: Read the existing README**

```bash
head -30 README.md
```

Locate the top of the file (usually `# Blog` or similar). The badge goes right under the top-level heading.

- [ ] **Step 2: Add the CI badge**

Insert this line immediately after the `# <Title>` heading. If the README already has a badges row, append to it:

```markdown
[![CI](https://github.com/eagle-head/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/eagle-head/blog/actions/workflows/ci.yml)
```

- [ ] **Step 3: Preview the markdown**

```bash
head -10 README.md
```

Expected: the badge markdown appears on its own line under the title, with no trailing whitespace.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): add ci badge"
```

---

## Phase 2 — Cloudflare Pages Build Hints

Cloudflare Pages serves `dist/` after a `npm run build`. Two small files in `public/` (which are copied verbatim into `dist/`) give us
security headers and a defensive redirect rule without any Cloudflare-specific config file at the project root.

### Task 2.1 — Security headers

The brief doesn't ask for a CSP, but Pages makes the headers file cheap and the posture it enables (frame-ancestors, referrer-policy,
permissions-policy) is the baseline that every static site should ship. Keep the CSP loose enough that the features we already shipped
(Giscus iframe, Cloudflare Analytics beacon, KaTeX inline math) keep working.

**Files:**

- Create: `/home/eduardo/Documents/blog/public/_headers`

- [ ] **Step 1: Write the file**

```text
/*
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://giscus.app https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-src https://giscus.app; connect-src 'self' https://giscus.app https://cloudflareinsights.com; base-uri 'self'; form-action https://buttondown.com
```

Rationale per directive:

- `'unsafe-inline'` on `script-src`: Astro emits inline theme-init + giscus attrs + Pagefind bootstrap; switching to nonces is a post-v0
  hardening task.
- `script-src` allow-listing `giscus.app` and `static.cloudflareinsights.com`: both are third-party scripts we explicitly include.
- `frame-src https://giscus.app`: required for the comments iframe.
- `form-action https://buttondown.com`: the newsletter form POSTs to Buttondown.
- `connect-src 'self' https://giscus.app https://cloudflareinsights.com`: Giscus polls + CF analytics beacon.
- `img-src 'self' data: https:`: `https:` is wide, but KaTeX inlines image URIs and Giscus may proxy avatars; narrowing is a future task.
- `base-uri 'self'`: lock down `<base>` tag hijack.
- HSTS: two years + preload — Cloudflare's recommended posture for apex domains.
- `interest-cohort=()`: opt out of FLoC / Topics API for all origins.

- [ ] **Step 2: Sanity-check the file lands in `dist/` on build**

```bash
npm run build && ls dist/_headers
```

Expected: `dist/_headers` prints, with the same content.

- [ ] **Step 3: Commit**

```bash
git add public/_headers
git commit -m "chore(deploy): add cloudflare pages security headers (_headers)"
```

---

### Task 2.2 — Trailing-slash redirect fallback

Astro is configured with `trailingSlash: 'never'` — the emitted HTML and sitemap never contain trailing slashes. But a Cloudflare Edge rule
or a mistyped bookmark could still produce `/papers/` with a trailing slash; `_redirects` makes the canonical form stick.

**Files:**

- Create: `/home/eduardo/Documents/blog/public/_redirects`

- [ ] **Step 1: Write the file**

```text
# Canonicalize trailing slashes — Astro emits slash-less URLs; any arriving
# with a trailing slash (external rewrite, mistyped bookmark) gets 301'd.
# Apex `/` is preserved by convention (leading slash stays).
/*/ /:splat 301
```

- [ ] **Step 2: Verify build copies it**

```bash
npm run build && ls dist/_redirects
```

Expected: file present in `dist/`.

- [ ] **Step 3: Commit**

```bash
git add public/_redirects
git commit -m "chore(deploy): add trailing-slash redirect rule (_redirects)"
```

---

## Phase 3 — Deploy Runbook

The Cloudflare dashboard work is one-time and cannot be automated from this repo without Wrangler credentials in CI. Document it precisely
so the human partner can follow it unassisted.

### Task 3.1 — Write `DEPLOY.md`

**Files:**

- Create: `/home/eduardo/Documents/blog/DEPLOY.md`

- [ ] **Step 1: Write the runbook**

````markdown
# Deploy Runbook — Cloudflare Pages

This is a one-time setup. Once the project is connected to GitHub, every push to `main` triggers a production build; every PR triggers a
preview deployment at a throwaway `<pr-branch>.<project>.pages.dev` URL.

## 1. Prerequisites

- Cloudflare account.
- `kohn.dev` domain registered and pointing its nameservers at Cloudflare (Cloudflare dashboard → Websites → Add a site).
- GitHub repo public at `https://github.com/eagle-head/blog`.

## 2. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize the Cloudflare GitHub app if not already authorized. Grant access to the `eagle-head/blog` repository only (principle of least
   privilege).
3. Select the repository. Click **Begin setup**.
4. **Project name:** `kohn-dev` (this becomes `kohn-dev.pages.dev`; the custom domain overrides it later).
5. **Production branch:** `main`.
6. **Build settings:**
   - **Framework preset:** `Astro` (Cloudflare auto-detects; verify).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (leave blank/default).

## 3. Environment variables (build-time)

Still on the project-creation screen, add these under **Environment variables** (Production):

| Variable                    | Value                                                                                                   | Source                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `NODE_VERSION`              | `22.12.0`                                                                                               | Must match `.nvmrc` in the repo. CF reads this to provision the build image. |
| `PUBLIC_GISCUS_REPO`        | `eagle-head/blog`                                                                                       | See step 4 below for the ID lookup.                                          |
| `PUBLIC_GISCUS_REPO_ID`     | From `https://giscus.app` after enabling Discussions on the repo.                                       | Step 4.                                                                      |
| `PUBLIC_GISCUS_CATEGORY`    | `Announcements` (the Discussions category you want comments nested under).                              | Step 4.                                                                      |
| `PUBLIC_GISCUS_CATEGORY_ID` | From `https://giscus.app`.                                                                              | Step 4.                                                                      |
| `PUBLIC_CF_ANALYTICS_TOKEN` | From Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site** → copy the token. | Step 5.                                                                      |

Apply the same list to the **Preview** environment so PR previews get real comments + analytics. Or leave them unset in Preview if you
prefer PRs to render the empty-state Giscus/analytics branches — both work.

Click **Save and deploy**. The first build will run; expect ~90s for install + build.

## 4. Giscus setup

1. On GitHub: repo → **Settings** → **General** → **Features** → enable **Discussions**.
2. Create a Discussion category (Settings → Discussions → New category). Name it whatever matches `PUBLIC_GISCUS_CATEGORY` (the default in
   `.env.example` is `Announcements`).
3. Install the Giscus GitHub App: https://github.com/apps/giscus → **Configure** → pick the repository.
4. Visit `https://giscus.app`. Fill in the form:
   - Repository: `eagle-head/blog`
   - Page ↔ Discussion mapping: **pathname** (matches the component).
   - Category: the one you created.
   - Features: **Reactions enabled**, **Emit discussion metadata: off**, **Input position: above comments**, **Theme: Preferred color
     scheme**.
   - Leave the "enable lazy loading" box checked.
5. Copy the four values Giscus shows in the embedded `<script>` snippet (`data-repo`, `data-repo-id`, `data-category`, `data-category-id`)
   into the matching CF Pages env vars from step 3.

## 5. Cloudflare Web Analytics setup

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Hostname: `kohn.dev`. Click **Done**.
3. Copy the **token** (a 32-char hex string). Paste as the value of `PUBLIC_CF_ANALYTICS_TOKEN` in the Pages project env vars (step 3).
4. **Do not** paste the provided `<script>` snippet into the site — the `Analytics.astro` component already emits it from the env var.

## 6. Custom domain

1. On the Pages project → **Custom domains** → **Set up a custom domain** → `kohn.dev`.
2. If the domain is already on Cloudflare DNS, the CNAME is created automatically. Approve it.
3. Add `www.kohn.dev` as a second custom domain with the **Redirect to primary domain** option, so `www.kohn.dev` → `kohn.dev`.
4. Wait for SSL to provision (usually 1–5 minutes; you can refresh the status on the custom-domains page).

## 7. Smoke test the production deploy

Once the first deploy completes and the custom domain is active:

```bash
# Security headers
curl -sI https://kohn.dev/ | grep -iE "content-security-policy|strict-transport|referrer-policy"

# OG image
curl -sI https://kohn.dev/og/papers/quicksort-partitioning-en.png | head -3

# Sitemap
curl -s https://kohn.dev/sitemap-index.xml | head -20

# RSS (combined, EN)
curl -s https://kohn.dev/rss.xml | head -20

# Palette search
curl -s https://kohn.dev/pagefind/pagefind.js | head -c 80
```

Each command should return 200 OK with the expected body prefix.

## 8. Ongoing operations

- **Rollbacks:** Pages keeps every deployment. Dashboard → project → **Deployments** → pick a previous prod deploy → **Rollback**.
- **Preview URLs:** every PR gets `https://<branch>.<project>.pages.dev`. The URL is posted on the PR by the Cloudflare GitHub integration.
- **Cache purge:** Dashboard → Caching → Configuration → **Purge everything**. Pages also auto-purges the edge cache after each deployment.

## 9. Removing the setup

If you ever disconnect the project:

1. Dashboard → project → **Settings** → **Delete project**. Keeps deployments purgeable for 30 days.
2. Remove the GitHub App (`https://github.com/settings/installations/` → Cloudflare Pages → Configure → Uninstall).
3. Remove custom domain records (Cloudflare DNS → `kohn.dev` zone → delete the CNAME rows for `@` and `www` that pointed at the Pages
   project).
````

- [ ] **Step 2: Lint the doc**

```bash
npm run lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 3: Commit**

```bash
git add DEPLOY.md
git commit -m "docs(deploy): add cloudflare pages runbook"
```

---

### Task 3.2 — Link deploy runbook from README

**Files:**

- Modify: `/home/eduardo/Documents/blog/README.md`

- [ ] **Step 1: Read the current README**

```bash
cat README.md
```

Identify a reasonable insertion point near the end (after usage / scripts, before license if present).

- [ ] **Step 2: Append a deploy section**

Add this block at the end of the README (keep one blank line between it and the preceding section). Adjust the header level to match the
rest of the doc (likely `##`):

```markdown
## Deploy

Production hosts at [`kohn.dev`](https://kohn.dev) on Cloudflare Pages. The one-time dashboard setup (project creation, env vars, custom
domain, Giscus, Cloudflare Analytics) is documented in [`DEPLOY.md`](./DEPLOY.md). Every push to `main` triggers a production deploy; every
PR gets a preview URL posted back by the Cloudflare GitHub app.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): link deploy runbook"
```

---

## Phase 4 — Verification

### Task 4.1 — Full local CI equivalence

**Files:** none (verification only).

- [ ] **Step 1: Run the exact commands CI runs, in order**

```bash
npm ci
npm run lint:md
npm run format:check
npm run check
npm test
npm run build
```

Expected: every command exits 0. If any fails, fix it before tagging — a red main is not a valid tag point.

- [ ] **Step 2: Inspect `_headers` and `_redirects` in the build output**

```bash
cat dist/_headers | head -5 && echo "---" && cat dist/_redirects
```

Expected: both files are present at the root of `dist/`.

- [ ] **Step 3: Confirm no secrets leaked into the build**

```bash
grep -rE "PUBLIC_GISCUS_REPO_ID|PUBLIC_CF_ANALYTICS_TOKEN" dist/ 2>/dev/null | grep -v "/pagefind/" | head -5
```

Expected: no matches. The component early-returns `null` when env vars are empty (which they are locally), so no var names should appear in
emitted HTML.

---

### Task 4.2 — Push to main and verify GitHub Actions is green

**Files:** none.

- [ ] **Step 1: Push**

```bash
git push origin main
```

- [ ] **Step 2: Watch the Actions tab**

Visit `https://github.com/eagle-head/blog/actions`. The latest `CI` run (triggered by the push) should finish green within ~3 minutes.

- [ ] **Step 3: If red, fix locally and repush**

```bash
# Reproduce the failing step
npm run <step-that-failed>
# Fix, recommit, repush
git add -A
git commit -m "fix(ci): <what broke>"
git push origin main
```

Do not move to Task 4.3 until CI is green on `main`.

---

### Task 4.3 — Tag the release

- [ ] **Step 1: Confirm clean tree**

```bash
git status
```

Expected: "nothing to commit, working tree clean."

- [ ] **Step 2: Tag**

```bash
git tag -a v0.6.0-deploy -m "ci + cloudflare pages deploy: workflow, headers, redirects, runbook"
```

- [ ] **Step 3: Push the tag**

```bash
git push origin v0.6.0-deploy
```

- [ ] **Step 4: Summary output**

```bash
git log --oneline -n 10 && echo "---" && git tag -n1 -l "v0.*"
```

---

## Out of Scope (v1+ ideas, not this plan)

- Nonce-based CSP (remove the `'unsafe-inline'` on `script-src`).
- Wrangler-driven deploys from GitHub Actions (trade-off: more moving parts for the same outcome).
- E2E browser tests (Playwright) in CI — today we rely on type + unit coverage.
- Lighthouse CI gates on PRs.
- Alerts / uptime monitoring — Cloudflare's built-in metrics + Web Analytics are sufficient for v0.
- Preemptive fix for `rehype-mermaid` on Cloudflare Pages: current sample content has no mermaid diagrams, so no Chromium is launched at
  build time. The first mermaid diagram added to an MDX file will require either adding `npx playwright install chromium` to the CF Pages
  build command, or switching the rehype-mermaid strategy to `pre-mermaid` (client-side rendering). Decide then, not now.
