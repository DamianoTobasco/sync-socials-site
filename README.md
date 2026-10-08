# Sync Socials — marketing site

The public homepage for **sync-socials.com**. Pure static HTML/CSS/JS — no build
step, no dependencies. Hosted free on GitHub Pages, fronted by Cloudflare.

```
index.html      → the whole page
styles.css      → all styling (light + dark, brand: ivory + green)
script.js       → mobile menu, billing toggle, FAQ, theme toggle, scroll reveal
assets/         → logos, product media, and page-specific social preview PNGs + SVG sources
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

## Support widget and Cloudflare headers

`support-widget.js` embeds the app's `/support/widget` route. The marketing site's
production `Content-Security-Policy` is set in Cloudflare, outside this repository.
Its existing policy must include:

```text
frame-src 'self' https://app.sync-socials.com;
```

Applied on October 6, 2026 in the existing Cloudflare `Security response headers`
rule. Add this directive to the existing policy for the marketing hosts. Preserve every
other directive and security header, including `frame-ancestors 'none'` and
`X-Frame-Options: DENY`, which protect the marketing page itself. Do not add a
second CSP header: multiple policies are all enforced and cannot loosen one
another. Without `frame-src`, `default-src 'self'` blocks the support iframe.

`growth.js` also calls the app's `/api/growth` endpoints (config and visits), so
the same policy's `connect-src` must include `https://app.sync-socials.com`:

```text
connect-src 'self' https://www.facebook.com https://connect.facebook.net https://cloudflareinsights.com https://app.sync-socials.com;
```

As of October 7, 2026 the live header lacks it, so the browser blocks those
requests: no analytics choice is offered on the marketing site and no campaign
source is recorded there. Edit the same rule rather than adding a second header.

The app separately permits only its own and the two marketing origins in the
widget's `frame-ancestors`; other app routes retain their framing protection.
After publishing or changing Cloudflare rules, check the live response headers
and open Ask Sync on desktop and mobile. Confirm the iframe loads without a CSP
error, opens at the right size, and can send a support message. A successful
GitHub Pages deployment alone does not verify the external header configuration.

---

## Editing content

Everything is in plain `index.html`. Common edits:

- **Prices** — search `data-monthly` / `data-yearly` in `index.html`.
- **CTA links** — search `app.sync-socials.com`.
- **Platforms** — the `.platform-grid` block in `index.html`.
- **Brand colors** — the `:root` (light) and `[data-theme="dark"]` blocks at the
  top of `styles.css`. They mirror the app's tokens (`--accent: #2f9d63`).
- **Social previews** — edit the matching `assets/og-*.svg` source and export a
  1200×630 PNG. Each page has its own `og:image` and `twitter:image`, dimensions,
  MIME type and alt text. Keep PNGs below 1 MB; the current cards are 31–34 KB.
  The homepage uses `og-home-v3`; the other five pages use their `v2` cards.
  When replacing a published card, use a new versioned filename to help avoid
  stale social caches, and update both image tags and the JSON-LD ImageObject.
- **Search and agent discovery** — keep visible facts, JSON-LD and `llms.txt`
  consistent. Update `sitemap.xml` dates only when the corresponding page changes.
  See [SEO and discovery notes](docs/seo-discovery.md) for checks and publishing follow-up.
