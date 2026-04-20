# Deploy Runbook — Cloudflare Workers (Static Assets)

This is a one-time setup. Once the project is connected to GitHub, every push to `main` triggers a production build via
[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/); every PR triggers a preview deployment at a throwaway
`<pr-branch>.<project>.workers.dev` URL (with non-production branch builds enabled).

## Why Workers and not Pages?

Per the
[official Cloudflare guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/#use-workers-static-assets-for-new-projects),
Workers Static Assets is the recommended deployment target for new static sites; Pages continues to work but new features and optimizations
are being focused on Workers. `_headers` and `_redirects` are
[supported natively](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#headers-and-redirects) on
Workers Static Assets, so the migration is transparent for this project.

## 1. Prerequisites

- Cloudflare account.
- `eduardokohn.com` domain registered on Cloudflare (registrar + DNS in one place).
- GitHub repo public at `https://github.com/eagle-head/blog`.
- `wrangler.jsonc` committed at the repo root (already present).

## 2. Create the Workers application

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Authorize the Cloudflare GitHub app if not already authorized. Use **"Only select repositories"** and grant access to `eagle-head/blog`
   only (principle of least privilege).
3. Select the repository. Click **Begin setup**.
4. **Project name:** `eduardokohn` (this becomes `eduardokohn.workers.dev`; the custom domain overrides it later).
5. **Production branch:** `main`.
6. **Build settings:**
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (the default — matches the `wrangler.jsonc` in the repo)
   - **Builds for non-production branches:** checked (enables PR preview deploys)
7. **Advanced settings** (expand the section):
   - **Root directory:** `/` (default)
   - **Build variables and secrets:** add the entries from step 3 below

## 3. Environment variables (build-time)

Still on the project-creation screen, under **Build variables and secrets** add these:

| Variable                    | Value                                                                                                   | Source                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `NODE_VERSION`              | `22.12.0`                                                                                               | Must match `.nvmrc` in the repo. CF reads this to provision the Node build image. |
| `PUBLIC_GISCUS_REPO`        | `eagle-head/blog`                                                                                       | See step 4 below for the ID lookup.                                               |
| `PUBLIC_GISCUS_REPO_ID`     | From `https://giscus.app` after enabling Discussions on the repo.                                       | Step 4.                                                                           |
| `PUBLIC_GISCUS_CATEGORY`    | `Announcements` (the Discussions category you want comments nested under).                              | Step 4.                                                                           |
| `PUBLIC_GISCUS_CATEGORY_ID` | From `https://giscus.app`.                                                                              | Step 4.                                                                           |
| `PUBLIC_CF_ANALYTICS_TOKEN` | From Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site** → copy the token. | Step 5.                                                                           |

The Giscus and Analytics env vars can be **left empty** on the first deploy — `Giscus.astro` and `Analytics.astro` both early-return `null`
when their env vars are missing, so the build succeeds and the island elements simply don't emit any third-party script. Fill them in later
and redeploy when you've run through steps 4 and 5.

Click **Deploy**. The first build runs `npm ci` + `npm run build` + `npx wrangler deploy`; expect ~90s.

## 4. Giscus setup

1. On GitHub: repo → **Settings** → **General** → **Features** → enable **Discussions**.
2. Create a Discussion category (Settings → Discussions → New category). Name it whatever matches `PUBLIC_GISCUS_CATEGORY` (the default in
   `.env.example` is `Announcements`).
3. Install the Giscus GitHub App: `https://github.com/apps/giscus` → **Configure** → pick the repository.
4. Visit `https://giscus.app`. Fill in the form:
   - Repository: `eagle-head/blog`
   - Page ↔ Discussion mapping: **pathname** (matches the component).
   - Category: the one you created.
   - Features: **Reactions enabled**, **Emit discussion metadata: off**, **Input position: above comments**, **Theme: Preferred color
     scheme**.
   - Leave the "enable lazy loading" box checked.
5. Copy the four values Giscus shows in the embedded `<script>` snippet (`data-repo`, `data-repo-id`, `data-category`, `data-category-id`)
   into the matching Workers env vars from step 3 and redeploy.

## 5. Cloudflare Web Analytics setup

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Hostname: `eduardokohn.com`. Click **Done**.
3. Copy the **token** (a 32-char hex string). Paste as the value of `PUBLIC_CF_ANALYTICS_TOKEN` in the Workers project env vars (step 3) and
   redeploy.
4. **Do not** paste the provided `<script>` snippet into the site — the `Analytics.astro` component already emits it from the env var.

## 6. Custom domain

1. On the Workers project → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `eduardokohn.com`.
2. If the domain is already on Cloudflare DNS, the CNAME is created automatically. Approve it.
3. Add `www.eduardokohn.com` as a second custom domain with the **Redirect to primary domain** option, so `www.eduardokohn.com` →
   `eduardokohn.com`.
4. Wait for SSL to provision (usually 1–5 minutes; you can refresh the status on the Domains & Routes page).

## 7. Smoke test the production deploy

Once the first deploy completes and the custom domain is active:

```bash
# Security headers
curl -sI https://eduardokohn.com/ | grep -iE "content-security-policy|strict-transport|referrer-policy"

# OG image
curl -sI https://eduardokohn.com/og/papers/quicksort-partitioning-en.png | head -3

# Sitemap
curl -s https://eduardokohn.com/sitemap-index.xml | head -20

# RSS (combined, EN)
curl -s https://eduardokohn.com/rss.xml | head -20

# Palette search
curl -s https://eduardokohn.com/pagefind/pagefind.js | head -c 80
```

Each command should return 200 OK with the expected body prefix.

## 8. Ongoing operations

- **Rollbacks:** Workers keeps every deployment. Dashboard → project → **Deployments** → pick a previous prod deploy → **Rollback**.
- **Preview URLs:** every PR gets `https://<branch>.<project>.workers.dev`. The URL is posted on the PR by the Cloudflare GitHub
  integration.
- **Logs and observability:** Dashboard → project → **Observability** shows invocation logs and errors from the static-assets runtime.
- **Cache purge:** custom domain cache auto-purges on each deployment; for ad-hoc purges go to the domain's DNS zone → **Caching** →
  **Configuration** → **Purge everything**.

## 9. Removing the setup

If you ever disconnect the project:

1. Dashboard → project → **Settings** → **Delete**. Deployment history is retained for 30 days.
2. Remove the Cloudflare GitHub App (`https://github.com/settings/installations/` → Cloudflare → Configure → Uninstall).
3. Remove custom domain records (Cloudflare DNS → `eduardokohn.com` zone → delete the routes that pointed at the Worker).
