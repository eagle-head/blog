# Deploy Runbook — Cloudflare Pages

This is a one-time setup. Once the project is connected to GitHub, every push to `main` triggers a production build; every PR triggers a
preview deployment at a throwaway `<pr-branch>.<project>.pages.dev` URL.

## 1. Prerequisites

- Cloudflare account.
- `eduardokohn.com` domain registered and pointing its nameservers at Cloudflare (Cloudflare dashboard → Websites → Add a site).
- GitHub repo public at `https://github.com/eagle-head/blog`.

## 2. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize the Cloudflare GitHub app if not already authorized. Grant access to the `eagle-head/blog` repository only (principle of least
   privilege).
3. Select the repository. Click **Begin setup**.
4. **Project name:** `eduardokohn` (this becomes `eduardokohn.pages.dev`; the custom domain overrides it later).
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
3. Install the Giscus GitHub App: `https://github.com/apps/giscus` → **Configure** → pick the repository.
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
2. Hostname: `eduardokohn.com`. Click **Done**.
3. Copy the **token** (a 32-char hex string). Paste as the value of `PUBLIC_CF_ANALYTICS_TOKEN` in the Pages project env vars (step 3).
4. **Do not** paste the provided `<script>` snippet into the site — the `Analytics.astro` component already emits it from the env var.

## 6. Custom domain

1. On the Pages project → **Custom domains** → **Set up a custom domain** → `eduardokohn.com`.
2. If the domain is already on Cloudflare DNS, the CNAME is created automatically. Approve it.
3. Add `www.eduardokohn.com` as a second custom domain with the **Redirect to primary domain** option, so `www.eduardokohn.com` →
   `eduardokohn.com`.
4. Wait for SSL to provision (usually 1–5 minutes; you can refresh the status on the custom-domains page).

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

- **Rollbacks:** Pages keeps every deployment. Dashboard → project → **Deployments** → pick a previous prod deploy → **Rollback**.
- **Preview URLs:** every PR gets `https://<branch>.<project>.pages.dev`. The URL is posted on the PR by the Cloudflare GitHub integration.
- **Cache purge:** Dashboard → Caching → Configuration → **Purge everything**. Pages also auto-purges the edge cache after each deployment.

## 9. Removing the setup

If you ever disconnect the project:

1. Dashboard → project → **Settings** → **Delete project**. Keeps deployments purgeable for 30 days.
2. Remove the GitHub App (`https://github.com/settings/installations/` → Cloudflare Pages → Configure → Uninstall).
3. Remove custom domain records (Cloudflare DNS → `eduardokohn.com` zone → delete the CNAME rows for `@` and `www` that pointed at the Pages
   project).
