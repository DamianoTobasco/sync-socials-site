# Sync Socials — marketing site

The public homepage for **sync-socials.com**. Pure static HTML/CSS/JS — no build
step, no dependencies. Hosted free on GitHub Pages, fronted by Cloudflare.

```
index.html      → the whole page
styles.css      → all styling (light + dark, brand: ivory + green)
script.js       → mobile menu, billing toggle, FAQ, theme toggle, scroll reveal
assets/         → favicon (add og.png here for social sharing previews)
CNAME           → tells GitHub Pages the custom domain is sync-socials.com
.nojekyll       → disables Jekyll so files serve as-is
```

The app login / signup CTAs point at **app.sync-socials.com** (your existing SaaS).

---

## Local preview

```bash
cd sync-socials-site
python3 -m http.server 4321
# open http://localhost:4321
```

---

## Deploy to GitHub Pages

**1. Create a repo and push**

```bash
cd sync-socials-site
git init
git add .
git commit -m "Sync Socials marketing site"
git branch -M main
git remote add origin https://github.com/<your-username>/sync-socials-site.git
git push -u origin main
```

**2. Turn on Pages**

GitHub repo → **Settings → Pages** → *Source:* **Deploy from a branch** →
Branch **main** / **/ (root)** → Save. The included `CNAME` makes Pages serve
the site at `sync-socials.com`.

---

## Point Cloudflare DNS at GitHub Pages

In the Cloudflare dashboard for **sync-socials.com → DNS**, add the apex records.
> ⚠️ Keep your existing `app` record (app.sync-socials.com → your droplet) untouched.

**Apex (`sync-socials.com`)** — four `A` records to GitHub's IPs:

| Type | Name | Content        | Proxy        |
|------|------|----------------|--------------|
| A    | @    | 185.199.108.153 | Proxied (orange) |
| A    | @    | 185.199.109.153 | Proxied |
| A    | @    | 185.199.110.153 | Proxied |
| A    | @    | 185.199.111.153 | Proxied |

**www (optional redirect to apex):**

| Type  | Name | Content                 | Proxy |
|-------|------|-------------------------|-------|
| CNAME | www  | `<your-username>.github.io` | Proxied |

**Cloudflare SSL/TLS:** set encryption mode to **Full** (not Flexible) to avoid a
redirect loop. Then in GitHub **Settings → Pages**, tick **Enforce HTTPS** once the
custom-domain check goes green (can take a few minutes to an hour).

That's it — `sync-socials.com` is live, free hosting, and your SaaS at
`app.sync-socials.com` keeps running exactly as before.

---

## Editing content

Everything is in plain `index.html`. Common edits:

- **Prices** — search `data-monthly` / `data-yearly` in `index.html`.
- **CTA links** — search `app.sync-socials.com`.
- **Platforms** — the `.platform-grid` block in `index.html`.
- **Brand colors** — the `:root` (light) and `[data-theme="dark"]` blocks at the
  top of `styles.css`. They mirror the app's tokens (`--accent: #2f9d63`).
- **Social preview image** — drop a 1200×630 `og.png` into `assets/`.
