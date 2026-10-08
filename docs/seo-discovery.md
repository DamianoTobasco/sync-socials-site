# SEO and discovery cleanup — September 17, 2026

The marketing site publishes from the `main` branch through GitHub Pages.
After each deployment, verify production and refresh the OpenGraph report as
described below; the public report reads the deployed site.

## What changed

- All six public HTML pages have unique titles/descriptions, canonical URLs,
  complete Open Graph and X card metadata, and page-specific 1200×630 PNGs.
- The homepage preview is 30,901 bytes, replacing the roughly 1.3 MB dashboard
  screenshot flagged by OpenGraph. All six cards are below 35 KB. Editable SVG
  sources sit beside the PNGs; the site still requires no build step.
- The homepage's `og-home-v3` revision enlarges the headline from 68 to 100 pixels
  and workflow labels from 23 to 46 pixels. Large icons replace the step numbers,
  and secondary labels, descriptions and footer copy are removed. The card was
  inspected at 320 pixels wide for small social previews; `v2` remains available
  as the earlier design.
- Descriptions are 152–160 characters for search and 95–121 for social previews.
  These are practical editorial targets, not guarantees against truncation.
- WebPage and ImageObject entities connect each page to its preview and the
  existing organization/site graph. Software facts and FAQ answers reflect the
  visible product content. No invented ratings or review schema were added.
- Agent documentation identifies the hosted MCP endpoint, required account/API
  access, supported workflows, asynchronous generation and provider costs.
- Meta approved the requested permissions on October 5, 2026. Facebook Pages
  and linked Instagram professional accounts are available for new and existing
  customers; visible notices, FAQs, JSON-LD and `llms.txt` reflect that scope.
  The ChatGPT app is published; its direct listing and setup guide are linked
  from the homepage and agent guide. Claude plugin setup remains separate from
  its connector directory review.
- The Buffer comparison now acknowledges its MCP/API and paid-plan scheduling.
  The Hootsuite comparison uses the current Standard plan name and describes
  monthly/annual billing accurately. Both link to dated primary sources.
- Sitemap dates reflect these page edits. Existing permissive crawler policy is
  preserved, with explicit social-preview agents documented in `robots.txt`.
- Headings retain word separation when mobile CSS hides their line breaks.

## X availability update — October 8, 2026

X is live on active paid Growth subscriptions after the trial. The homepage,
comparison pages, ChatGPT and Claude guides, agent guide, and `llms.txt` now
reflect that availability. The X allowance is shared across the workspace:
up to 50 publish attempts per UTC month, including 3 with links, and 10 per day;
each account has limits of 30 per month and 3 per day. OAuth connection is
required. Visible pricing and scheduling copy distinguishes unlimited scheduling
from the X publishing allowance, and structured FAQ answers use the same facts.

Validation covered all eight HTML pages and JSON-LD blocks, 26 matching FAQ
answers, 315 local references, and 145 fragment links. All six changed HTML
pages passed desktop and mobile layout checks with no horizontal overflow.
The homepage diagram includes X with a paid Growth label; its cards remain
visible with both normal and reduced motion. The published Claude plugin’s X
instructions still await an update, so its guide directs X publishing to the
dashboard in the meantime. No new marketplace approval is implied.

## Verification

- Six pages passed checks for required/duplicate metadata, title/description
  lengths, one H1, PNG signature/dimensions/size, and matching OG/X images.
- All 25 structured FAQ answers match the corresponding HTML answers.
- All 193 local file references and 96 fragment links resolve.
- Sitemap URLs exactly match the six page canonicals; all canonicals are unique.
- All six social images were visually inspected.
- The homepage and agent setup content were inspected in a browser, including
  the agent page at 390 pixels wide. No horizontal overflow was found there.
- Before deployment, production homepage, robots, sitemap, llms.txt and agent
  guide returned HTTP 200. Requests using Googlebot, OAI-SearchBot,
  ChatGPT-User, PerplexityBot, Twitterbot and facebookexternalhit user-agent
  strings also received homepage HTML without a challenge. This checks the
  observed response from this network; it does not prove crawler-IP access or
  actual indexing. Review real crawler traffic in Cloudflare if issues persist.

## After publishing

1. Confirm production returns the new HTML and all six PNGs with HTTP 200 and
   the expected content type. Check for CDN or security rules serving old HTML
   or challenging verified crawlers.
2. Rescan `https://sync-socials.com/` in OpenGraph. Refresh cached previews with
   the platform's own inspector where available, including Facebook Sharing
   Debugger and LinkedIn Post Inspector. Different platforms cache independently.
3. In Google Search Console and Bing Webmaster Tools, confirm the domain is
   verified and submit `https://sync-socials.com/sitemap.xml`. Inspect the homepage
   and agent guide and request indexing where appropriate. Submission and indexing
   were not performed as part of this local change.
4. Monitor indexing, search queries, referrals and signups. Prioritize useful
   product documentation, real demonstrations and accurate comparisons as the
   product evolves. Technical cleanup alone cannot guarantee placement or AI citations.

`llms.txt` is supplementary documentation for tools that choose to read it.
It is not a Google ranking factor or a universal registration mechanism for
Grok, ChatGPT, Codex or OpenClaw. Public web discovery is separate from a client's
ability to authenticate to the MCP/API or from approval in a product directory.

## Sources

- [Original OpenGraph report](https://www.opengraph.xyz/url/https%3A%2F%2Fsync-socials.com)
- [Open Graph protocol](https://ogp.me/)
- [Google's AI search optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [OpenAI publisher and developer discovery guidance](https://help.openai.com/en/articles/12627856)
- [Buffer pricing](https://buffer.com/pricing) and [Buffer API/MCP](https://buffer.com/api)
- [Hootsuite plans](https://www.hootsuite.com/plans)
