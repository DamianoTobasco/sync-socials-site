#!/usr/bin/env python3
"""Generate the Sync Socials help center (static HTML) from the content below.

Run with the site directory as the only argument. Output goes to <site>/help/.
Every page shares the site's header, footer, fonts, scripts and theme. Facts
were checked against the app code on October 16, 2026.
"""
import html
import json
import os
import sys

SITE = "https://sync-socials.com"
APP = "https://app.sync-socials.com"
LASTMOD = "2026-10-16"
STYLES_VERSION = 19
SCRIPT_VERSION = 9
GROWTH_VERSION = 4
WIDGET_VERSION = 3

LOGIN = f"{APP}/login"
SIGNUP = f"{APP}/login?mode=signup&amp;next=%2Fcheckout%3FofferKey%3Dgrowth_monthly"
CONNECTIONS = f"{APP}/login?next=%2Fapp%2Fconnections"
SETTINGS = f"{APP}/login?next=%2Fapp%2Fsettings"
BILLING = f"{APP}/login?next=%2Fapp%2Fbilling"
CREATE = f"{APP}/login?next=%2Fapp%2Fcreate"
POSTED = f"{APP}/login?next=%2Fapp%2Fposted"
CALENDAR = f"{APP}/login?next=%2Fapp%2Fcalendar"
SUPPORT = "mailto:contactsyncsocials@gmail.com"


def head(slug, title, description, kicker=None, breadcrumb=None):
    url = f"{SITE}/help/{slug}" if slug != "index.html" else f"{SITE}/help/"
    crumbs = [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
        {"@type": "ListItem", "position": 2, "name": "Help center", "item": f"{SITE}/help/"},
    ]
    if breadcrumb:
        crumbs.append({"@type": "ListItem", "position": 3, "name": breadcrumb, "item": url})
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": url,
                "url": url,
                "name": title,
                "description": description,
                "inLanguage": "en-US",
                "isPartOf": {"@id": f"{SITE}/#website"},
                "about": {"@id": f"{SITE}/#software"},
                "publisher": {"@id": f"{SITE}/#organization"},
                "primaryImageOfPage": {"@id": f"{url}#primaryimage"},
            },
            {
                "@type": "ImageObject",
                "@id": f"{url}#primaryimage",
                "url": f"{SITE}/assets/og-home-v3.png",
                "contentUrl": f"{SITE}/assets/og-home-v3.png",
                "width": 1200,
                "height": 630,
                "caption": "Sync Socials: schedule once, publish everywhere.",
            },
            {"@type": "BreadcrumbList", "itemListElement": crumbs},
        ],
    }
    t = html.escape(title, quote=True)
    d = html.escape(description, quote=True)
    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{t} | Sync Socials Help</title>
  <meta name="description" content="{d}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Sync Socials" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="{t}" />
  <meta property="og:description" content="{d}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{SITE}/assets/og-home-v3.png" />
  <meta property="og:image:secure_url" content="{SITE}/assets/og-home-v3.png" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Sync Socials: schedule once, publish everywhere." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@syncyoursocials" />
  <meta name="twitter:title" content="{t}" />
  <meta name="twitter:description" content="{d}" />
  <meta name="twitter:image" content="{SITE}/assets/og-home-v3.png" />
  <meta name="twitter:image:alt" content="Sync Socials: schedule once, publish everywhere." />
  <link rel="canonical" href="{url}" />
  <meta name="theme-color" content="#0c1410" />
  <link rel="icon" type="image/png" href="/assets/logo-256.png" />
  <link rel="apple-touch-icon" href="/assets/logo-256.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Sora:wght@600;700;800&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css?v={STYLES_VERSION}" />
  <script type="application/ld+json">
  {json.dumps(graph, indent=2)}
  </script>
</head>
<body>
  <header class="site-header" id="top">
    <div class="container nav">
      <a class="brand" href="/" aria-label="Sync Socials home">
        <img class="brand-badge" src="/assets/logo-256.png" alt="Sync Socials logo" width="32" height="32" />
        <span class="brand-name">Sync&nbsp;Socials</span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        <a href="/#features">Features</a>
        <a href="/#integrations">Integrations</a>
        <a href="/help/" aria-current="{'page' if slug == 'index.html' else 'false'}">Help</a>
        <a href="/#pricing">Pricing</a>
      </nav>
      <div class="nav-actions">
        <button class="theme-toggle nav-theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">🌙</button>
        <a class="btn btn-ghost" href="{LOGIN}">Log in</a>
        <a class="btn btn-primary" href="{SIGNUP}">Try it free</a>
      </div>
      <button class="theme-toggle compact-theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">🌙</button>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
    <div class="mobile-menu" hidden>
      <a href="/#features">Features</a>
      <a href="/#integrations">Integrations</a>
      <a href="/help/">Help</a>
      <a href="/#pricing">Pricing</a>
      <a href="{LOGIN}">Log in</a>
      <a class="btn btn-primary" href="{SIGNUP}">Try it free</a>
    </div>
  </header>
"""


FOOTER = f"""  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/"><img class="brand-badge" src="/assets/logo-256.png" alt="Sync Socials logo" width="28" height="28" /><span class="brand-name">Sync Socials</span></a>
        <p>Plan, review, and publish from one workspace.</p>
      </div>
      <div class="footer-col"><h4>Product</h4><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/ai-social-media-agent.html">For AI agents</a>
        <a href="/chatgpt.html">ChatGPT setup guide</a><a href="/claude.html">Claude setup guide</a><a href="/llms.txt">Product facts for AI assistants</a></div>
      <div class="footer-col"><h4>Account</h4><a href="{LOGIN}">Log in</a><a href="{APP}/privacy">Privacy</a><a href="/data-deletion.html">Data deletion</a><a href="{APP}/terms">Terms</a></div>
      <div class="footer-col"><h4>Support</h4><a href="/help/">Help center</a><a href="{SUPPORT}">Contact Sync Socials</a><a href="/referral.html">Referral Program</a></div>
    </div>
    <div class="container footer-bottom"><span>© <span id="year">2026</span> Sync Socials. All rights reserved.</span><div class="theme-toggle-wrap"><button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">🌙</button></div></div>
  </footer>
  <script src="/script.js?v={SCRIPT_VERSION}"></script>
<script src="/growth.js?v={GROWTH_VERSION}" data-ads="meta" data-endpoint="{APP}/api/growth" defer></script>
<script src="/support-widget.js?v={WIDGET_VERSION}" defer></script>
</body>
</html>
"""


def guide(slug, kicker, title, lead, sections, related=()):
    """A guide page: hero, on-page nav, prose sections, related links."""
    toc = "".join(f'<a href="#{sid}">{html.escape(label)}</a>' for sid, label, _ in sections)
    body = "".join(f'<section id="{sid}">\n<h2>{html.escape(label)}</h2>\n{content}\n</section>\n' for sid, label, content in sections)
    rel = ""
    if related:
        items = "".join(f'<li><a href="/help/{s}">{html.escape(PAGES[s]["title"])}</a></li>' for s in related)
        rel = f'<section id="related">\n<h2>Related guides</h2>\n<ul class="help-related">{items}</ul>\n</section>\n'
    return f"""  <main class="claude-guide help-guide">
    <section class="section">
      <div class="container narrow">
        <p class="help-crumbs"><a href="/help/">Help center</a> <span aria-hidden="true">/</span> {html.escape(title)}</p>
        <div class="section-head">
          <p class="kicker">{html.escape(kicker)}</p>
          <h1>{html.escape(title)}</h1>
          <p class="lead">{lead}</p>
        </div>
      </div>
    </section>

    <div class="container narrow guide-content">
      <nav class="guide-toc" aria-label="On this page">
        {toc}
      </nav>

      <article class="cmp-prose guide-prose">
{body}{rel}
        <section id="contact" class="help-contact">
          <h2>Still stuck?</h2>
          <p>Email <a href="{SUPPORT}">contactsyncsocials@gmail.com</a> from your account email with the platform, what you expected, and what you saw. The founder answers personally, usually the same day. Never include passwords, tokens, or card details.</p>
        </section>
      </article>
    </div>
  </main>
"""


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------

PAGES = {}


def page(slug, *, kicker, title, description, lead, sections, related=(), group):
    PAGES[slug] = dict(kicker=kicker, title=title, description=description, lead=lead, sections=sections, related=related, group=group)


page(
    "getting-started.html",
    group="Start here",
    kicker="Start here",
    title="Getting started with Sync Socials",
    description="Create your workspace, connect an account, save a draft, and schedule your first post. The trial starts only when you schedule or publish.",
    lead="Three steps take most people under ten minutes. Nothing is charged until you schedule or publish your first post.",
    sections=[
        ("account", "Create your free account", f"""
<p>Go to <a href="{SIGNUP}">app.sync-socials.com</a> and sign up with Google or an email address and password. Email signups receive a confirmation link; open it to land in your workspace. You start free with no card: one account per platform and unlimited drafts. Scheduling and publishing start the 7-day free trial.</p>
<p>Every account gets its own workspace. Connected social accounts, drafts, media, and billing belong to the workspace, not to your personal login.</p>
"""),
        ("timezone", "Confirm your timezone", f"""
<p>The getting-started card on your Home page asks you to confirm the scheduling timezone. Every time you type into the scheduler is read in this timezone, so set it to where you actually are. You can change it later in <a href="{SETTINGS}">Settings</a>; existing scheduled posts keep their original times.</p>
"""),
        ("connect", "Connect your first account", f"""
<p>Open <a href="{CONNECTIONS}">Connections</a> and pick a channel. Facebook, Instagram, Threads, YouTube, TikTok, LinkedIn, and X use the platform's own sign-in; Bluesky, Telegram, Discord, and Slack take an app password, bot token, or webhook URL you paste in. Sync Socials never asks for a social-network password.</p>
<ul>
  <li><a href="/help/connect-facebook-instagram.html">Facebook Pages and Instagram</a></li>
  <li><a href="/help/connect-youtube.html">YouTube</a></li>
  <li><a href="/help/connect-tiktok.html">TikTok</a></li>
  <li><a href="/help/connect-linkedin.html">LinkedIn</a></li>
  <li><a href="/help/connect-threads-bluesky.html">Threads and Bluesky</a></li>
  <li><a href="/help/connect-x.html">X</a></li>
  <li><a href="/help/connect-telegram-discord-slack.html">Telegram, Discord, and Slack</a></li>
</ul>
"""),
        ("draft", "Save a draft", f"""
<p>Select <strong>Create post</strong>. The quick composer asks for a title, a caption, media if you want it, and the accounts it should go to. Save it as a draft to come back later, or move straight on to scheduling. Drafts are free and unlimited.</p>
<p>Need a different caption per channel, tags, or a custom video thumbnail? Choose <strong>Show all options</strong> inside the composer.</p>
"""),
        ("schedule", "Schedule or publish", f"""
<p>Pick a date and time, then <strong>Schedule</strong>, or choose <strong>Publish now</strong>. The first time you do, Sync Socials saves the post as a draft and asks you to start the 7-day free trial through Stripe: $0 today, then $19.95 per month unless you cancel before it ends. From then on, scheduling is unlimited.</p>
<p>Scheduled posts appear on the <a href="{CALENDAR}">Calendar</a>, where you can drag them to a better slot. Delivery results for every destination show up on <strong>Posted</strong>.</p>
"""),
    ],
    related=("schedule-and-publish.html", "billing-trial-and-cancellation.html", "timezones.html"),
)

page(
    "connect-facebook-instagram.html",
    group="Connect your accounts",
    kicker="Facebook and Instagram",
    title="Connect a Facebook Page and Instagram account",
    description="Connect Facebook Pages and linked Instagram professional accounts through Facebook Login, and fix the common “no Pages available” problem.",
    lead="Facebook and Instagram connect through one Facebook Login. Personal profiles aren't supported by Meta's publishing API, so you need a Page, and Instagram needs to be a professional account linked to that Page.",
    sections=[
        ("requirements", "What you need", """
<ul>
  <li>A Facebook <strong>Page</strong> you manage with permission to publish content.</li>
  <li>For Instagram: a <strong>professional</strong> account (Business or Creator) that is linked to that Facebook Page. Personal Instagram accounts can't be connected.</li>
  <li>The Owner role in your Sync Socials workspace.</li>
</ul>
<p>To check the Instagram link, open the Page's settings on Facebook and look under <strong>Linked accounts</strong>. If Instagram isn't there, link it first, then connect in Sync Socials.</p>
"""),
        ("steps", "Connect", f"""
<ol>
  <li>Open <a href="{CONNECTIONS}">Connections</a> and choose <strong>Connect through Facebook</strong> under Facebook or Instagram.</li>
  <li>Sign in to Facebook if asked, then review the Pages and Instagram accounts Facebook offers to share. Select the ones you want Sync Socials to publish to.</li>
  <li>Approve the requested permissions. Sync Socials asks only for what publishing and reading post performance need.</li>
  <li>If more than one Page or Instagram account was shared, choose which to add. Each one becomes its own destination.</li>
</ol>
<p>Pages owned through a business portfolio are supported. Connected accounts show a profile picture and follower count once the first sync completes.</p>
"""),
        ("no-pages", "“No Pages or Instagram accounts available”", """
<p>Facebook remembers which Pages you shared with Sync Socials the first time. On later connects it silently reuses that choice, so an account you added since then won't appear. During the Facebook Login dialog, select <strong>Edit previous settings</strong> and tick the Page or Instagram account you want, then continue.</p>
<p>Two other causes:</p>
<ul>
  <li>You're signed in to Facebook with a profile that doesn't manage the Page. Sign out of Facebook in that browser and sign in with the right profile.</li>
  <li>The Instagram account is personal, or isn't linked to the Page you shared. Switch it to professional and link it under the Page's settings.</li>
</ul>
<p>Be careful when editing the shared Pages: removing a Page from the shared list disconnects it in every workspace that used the same Facebook profile.</p>
"""),
        ("publishing", "What you can publish", """
<ul>
  <li><strong>Facebook Pages:</strong> text, photo posts with up to 10 images, and videos. Vertical videos that meet Facebook's rules are published as Reels.</li>
  <li><strong>Instagram:</strong> photo posts with up to 10 images and videos, which publish as Reels. Text-only posts aren't possible on Instagram.</li>
  <li>Images must be between 4:5 and 1.91:1 for Instagram. The composer shows which images need a crop and lets you choose the focus point.</li>
</ul>
<p>Views, reach, and interactions for both platforms appear under <strong>Analytics</strong> after the first sync.</p>
"""),
        ("reconnect", "Reconnecting", f"""
<p>Meta tokens expire and are refreshed automatically. If an account shows <strong>Needs reconnect</strong>, the token could not be refreshed, usually because the password changed, the Page role changed, or the permission was removed in Facebook settings. Choose <strong>Reconnect</strong> on the account in <a href="{CONNECTIONS}">Connections</a>; scheduled posts to that account resume once it's back.</p>
"""),
    ],
    related=("why-did-my-post-fail.html", "media-requirements.html", "connect-youtube.html"),
)

page(
    "connect-youtube.html",
    group="Connect your accounts",
    kicker="YouTube",
    title="Connect a YouTube channel",
    description="Connect your YouTube channel with Google, choose the default privacy for uploads, and understand what Sync Socials stores.",
    lead="YouTube connects through Google sign-in. Sync Socials uploads videos to the channel you choose and reads the channel's performance for Analytics.",
    sections=[
        ("requirements", "What you need", """
<ul>
  <li>A Google account that owns or manages the YouTube channel.</li>
  <li>If your Google account manages several channels, you'll pick which one to connect.</li>
  <li>The Owner role in your workspace. While you're still exploring before the trial, YouTube may ask you to start the trial first.</li>
</ul>
"""),
        ("steps", "Connect", f"""
<ol>
  <li>Open <a href="{CONNECTIONS}">Connections</a> and choose <strong>Connect YouTube</strong>.</li>
  <li>Read the YouTube terms page in Sync Socials and accept it. It explains exactly which data is read and how to remove it.</li>
  <li>Sign in with Google and allow the YouTube permissions.</li>
</ol>
"""),
        ("publishing", "Publishing videos", """
<ul>
  <li>Only <strong>video</strong> posts can go to YouTube. The campaign title becomes the video title and the caption becomes the description.</li>
  <li>Choose <strong>Private</strong>, <strong>Unlisted</strong>, or <strong>Public</strong> in the composer. Private is the default, which is useful for a first test.</li>
  <li>Add a custom thumbnail under <strong>Show all options</strong>. Without one, YouTube generates its own.</li>
  <li>Vertical videos under the Shorts length show up as Shorts on YouTube.</li>
</ul>
"""),
        ("data", "Data and disconnecting", f"""
<p>Sync Socials stores the channel identity, an encrypted token, and the performance numbers shown in Analytics. Disconnecting the channel in Connections removes that data from your workspace and asks Google to revoke the authorization. You can also remove access from your <a href="https://security.google.com/settings/security/permissions">Google security settings</a>. Full details are on the <a href="/data-deletion.html">data deletion page</a>.</p>
"""),
    ],
    related=("media-requirements.html", "why-did-my-post-fail.html", "getting-started.html"),
)

page(
    "connect-tiktok.html",
    group="Connect your accounts",
    kicker="TikTok",
    title="Connect TikTok and publish with Direct Post",
    description="Connect a TikTok account, choose visibility and interaction settings, and understand the disclosures TikTok requires for every post.",
    lead="TikTok publishes through its Direct Post API. Sync Socials sends the video or photos to your account and TikTok finishes processing on its side.",
    sections=[
        ("steps", "Connect", f"""
<ol>
  <li>Open <a href="{CONNECTIONS}">Connections</a> and choose <strong>Connect TikTok</strong>.</li>
  <li>Sign in to TikTok and keep <strong>both</strong> requested permissions enabled. If you remove one, the connection fails with a permission error; reconnect and approve both.</li>
</ol>
<p>The connected account shows its display name and avatar. Several TikTok accounts can be connected to one workspace.</p>
"""),
        ("settings", "Settings on every TikTok post", """
<p>TikTok requires a few choices on each post. They appear in the composer when a TikTok account is selected:</p>
<ul>
  <li><strong>Visibility:</strong> the list comes live from your TikTok account settings, so a private account only sees private options.</li>
  <li><strong>Comments, duets, and stitches:</strong> all off by default; turn on what you want.</li>
  <li><strong>Commercial content:</strong> declare brand-organic or branded content when the post promotes something. Branded content can't be private.</li>
  <li><strong>Music usage confirmation:</strong> tick the box to confirm you have rights to the audio. Sync Socials can't publish to TikTok without it.</li>
</ul>
"""),
        ("formats", "Videos and photos", """
<ul>
  <li>Videos publish as regular TikTok videos. Photo posts are supported too and are resized to fit inside TikTok's 1080p picture bounds.</li>
  <li>The campaign title is used as the photo title.</li>
  <li>After Sync Socials hands the post to TikTok, processing can take a few minutes before it appears on the profile. Posted shows the final result once TikTok confirms it.</li>
</ul>
"""),
    ],
    related=("media-requirements.html", "why-did-my-post-fail.html", "schedule-and-publish.html"),
)

page(
    "connect-threads-bluesky.html",
    group="Connect your accounts",
    kicker="Threads and Bluesky",
    title="Connect Threads and Bluesky",
    description="Connect a Threads profile with your Meta login, or a Bluesky account with an app password, and learn what each accepts.",
    lead="Threads connects through Meta's own sign-in. Bluesky takes an app password and connects in under a minute.",
    sections=[
        ("threads", "Threads", f"""
<ol>
  <li>Open <a href="{CONNECTIONS}">Connections</a> and choose <strong>Connect Threads</strong>.</li>
  <li>Sign in with the Instagram account that owns the Threads profile and allow the requested permissions.</li>
</ol>
<ul>
  <li>Text posts up to 500 characters, photo posts with up to 10 images, and videos.</li>
  <li>Hashtags count toward the 500 characters.</li>
  <li>The connection lasts about 60 days and renews itself while you keep using it; if it shows <strong>Needs reconnect</strong>, connect again.</li>
</ul>
<p>If the Threads card isn't shown in Connections yet, Threads access is still being enabled for this workspace; email support and we'll switch it on.</p>
"""),
        ("bluesky", "Bluesky", f"""
<ol>
  <li>In the Bluesky app, open <strong>Settings → Privacy and security → App passwords</strong> and add one named Sync Socials. Copy the password it shows; it looks like <code>xxxx-xxxx-xxxx-xxxx</code>.</li>
  <li>In <a href="{CONNECTIONS}">Connections</a>, open the Bluesky card, paste the app password, and enter your handle, like <code>you.bsky.social</code>.</li>
</ol>
<ul>
  <li>Text posts up to 300 characters and photo posts with up to 4 images. Links and hashtags are sent as proper Bluesky links and tags.</li>
  <li>Images are compressed for Bluesky's 1 MB limit automatically; a very large image may still need to be resized before upload.</li>
  <li>Video isn't supported yet.</li>
  <li>Never use your main Bluesky password. To disconnect, remove the account in Connections or revoke the app password in Bluesky.</li>
</ul>
"""),
    ],
    related=("media-requirements.html", "why-did-my-post-fail.html"),
)

page(
    "connect-linkedin.html",
    group="Connect your accounts",
    kicker="LinkedIn",
    title="Connect LinkedIn",
    description="Connect a LinkedIn personal profile and publish text or single-image posts. Company Pages and video aren't supported yet.",
    lead="Sync Socials publishes to LinkedIn personal profiles. Keep the scope in mind before planning a LinkedIn-heavy calendar.",
    sections=[
        ("steps", "Connect", f"""
<ol>
  <li>Open <a href="{CONNECTIONS}">Connections</a> and choose <strong>Connect LinkedIn</strong>.</li>
  <li>Sign in and allow the requested permissions.</li>
</ol>
<p>LinkedIn tokens last about two months. When one expires, the account shows <strong>Needs reconnect</strong>; choose Reconnect and your scheduled posts carry on.</p>
"""),
        ("scope", "What works and what doesn't", """
<ul>
  <li><strong>Supported:</strong> text posts and posts with one image, to your personal profile.</li>
  <li><strong>Not supported yet:</strong> company Pages, video, documents, and multi-image galleries. The composer blocks a multi-image post to LinkedIn instead of silently dropping images.</li>
</ul>
<p>Audience metrics for LinkedIn aren't available in Analytics; delivery results are on Posted.</p>
"""),
    ],
    related=("media-requirements.html", "connect-x.html"),
)

page(
    "connect-x.html",
    group="Connect your accounts",
    kicker="X",
    title="Connect X and understand the posting allowance",
    description="X publishing is included on paid Growth after the trial, with a monthly allowance of publish attempts per workspace and per account.",
    lead="X charges for API access per post, so Sync Socials includes a fixed allowance on paid Growth instead of unlimited publishing. You don't need your own X developer account.",
    sections=[
        ("eligibility", "Who can connect X", """
<ul>
  <li>An <strong>active paid Growth</strong> subscription after the trial. X is excluded from the free trial.</li>
  <li>An X account connected through the normal X sign-in from Connections. Connecting an AI agent does not connect X.</li>
</ul>
<p>There are five X connection attempts per workspace per month, so sign in carefully.</p>
"""),
        ("allowance", "The allowance", """
<ul>
  <li>Up to <strong>50 publish attempts per workspace per UTC calendar month</strong>, including up to <strong>3 posts with links</strong>.</li>
  <li>Up to <strong>10 attempts per UTC day</strong> per workspace.</li>
  <li>Each X account is also limited to 30 attempts per month and 3 per day, shared across every workspace it's connected to.</li>
  <li>Failed attempts count. Reconnecting or deleting the account doesn't reset usage. Media can use up the included budget before the post cap.</li>
</ul>
<p>Connections shows the remaining allowance. Daily limits reset at midnight UTC and monthly limits on the first day of the month. Reaching a limit pauses X publishing without any overage fee.</p>
"""),
        ("content", "What X accepts", """
<ul>
  <li>Plain text, up to four images, or one video up to 140 seconds and 50 MB.</li>
  <li>Captions, including hashtags, must fit 280 weighted characters. Links and emoji count differently from plain letters; the composer checks this before you post.</li>
  <li>Not supported: threads, long posts, animated GIFs, and X analytics.</li>
</ul>
"""),
    ],
    related=("billing-trial-and-cancellation.html", "media-requirements.html", "why-did-my-post-fail.html"),
)

page(
    "connect-telegram-discord-slack.html",
    group="Connect your accounts",
    kicker="Telegram, Discord, Slack",
    title="Connect Telegram, Discord, and Slack",
    description="Post to a Telegram channel with a bot token, or to Discord and Slack channels with incoming webhooks. No app review and no token expiry.",
    lead="These three connect in about a minute by pasting a credential. Sync Socials checks it live, then treats the channel like any other destination.",
    sections=[
        ("telegram", "Telegram channel", f"""
<ol>
  <li>In Telegram, message <strong>@BotFather</strong>, send <code>/newbot</code>, and copy the token it gives you. It looks like <code>123456789:ABC…</code>.</li>
  <li>Add that bot to your channel as an <strong>administrator</strong> with permission to post.</li>
  <li>In <a href="{CONNECTIONS}">Connections</a>, choose Telegram, paste the token, and enter the channel's <code>@username</code> or numeric chat id.</li>
</ol>
<p>If Sync Socials says it couldn't reach the channel, the bot isn't an admin there yet. Keep the token private; it lets anyone post as your bot.</p>
"""),
        ("discord", "Discord channel", f"""
<ol>
  <li>In Discord, open the server's <strong>Settings → Integrations → Webhooks</strong> and create a webhook for the channel you want.</li>
  <li>Copy the webhook URL and paste it into the Discord card in <a href="{CONNECTIONS}">Connections</a>.</li>
</ol>
"""),
        ("slack", "Slack channel", f"""
<ol>
  <li>In Slack, add the <strong>Incoming Webhooks</strong> app to your workspace and choose the channel it should post to.</li>
  <li>Copy the webhook URL that starts with <code>https://hooks.slack.com/services/…</code> and paste it into the Slack card in <a href="{CONNECTIONS}">Connections</a>.</li>
</ol>
"""),
        ("content", "What they accept", """
<ul>
  <li>Text, one image, or one video per post. A post with several images is blocked for these channels instead of losing images quietly.</li>
  <li>No audience metrics; delivery results are on Posted.</li>
</ul>
"""),
    ],
    related=("media-requirements.html", "why-did-my-post-fail.html"),
)

page(
    "schedule-and-publish.html",
    group="Publishing",
    kicker="Composer",
    title="Create, schedule, and publish a post",
    description="How the composer works: quick post versus all options, per-channel captions, scheduling in your timezone, and what happens after you publish.",
    lead="Write once, choose destinations, pick a time. Sync Socials adapts the post to each platform's format and tells you exactly what was delivered.",
    sections=[
        ("types", "Text, image, or video", """
<p>Start by picking the kind of post. The composer only offers accounts that can take that type: Instagram and TikTok need media, YouTube needs video, LinkedIn takes text or one image, and so on. Switching type clears incompatible selections.</p>
"""),
        ("quick", "Quick post and all options", """
<p>The composer opens in <strong>Quick post</strong>: title, caption, media, destinations, and a time. Choose <strong>Show all options</strong> for:</p>
<ul>
  <li><strong>Per-destination copy:</strong> a different caption, or a different title for YouTube and TikTok, for any selected account. Blank fields fall back to the shared caption.</li>
  <li><strong>Tags:</strong> appended as hashtags where the platform supports them.</li>
  <li><strong>Custom thumbnail</strong> for videos on YouTube, Facebook, and Instagram.</li>
</ul>
<p>Your choice is remembered on that browser. A post that already uses these options always opens with everything shown.</p>
"""),
        ("destinations", "Destinations", """
<p>Select the connected accounts the post should go to. <strong>Remember</strong> saves the current selection as your default for next time. Platform limits for the selected accounts, such as image counts and caption lengths, appear under the destination list.</p>
"""),
        ("time", "Scheduling", f"""
<p>Enter a date and time, or use the suggested slots. Times are read in the workspace timezone shown beside the field; change it in <a href="{SETTINGS}">Settings</a> if it's wrong. <strong>Schedule</strong> queues the post; <strong>Publish now</strong> sends it immediately; <strong>Save draft</strong> keeps it without a time.</p>
<p>Scheduled posts show on the <a href="{CALENDAR}">Calendar</a>. Drag one to a new day or time to reschedule it without rebuilding the post. Edit a scheduled post from Home or Drafts until it starts publishing.</p>
"""),
        ("after", "After publishing", f"""
<p>A background worker publishes each destination separately and retries temporary platform errors. <a href="{POSTED}">Posted</a> lists every post with the result per destination: delivered, failed, or still processing on the platform's side. If one destination fails while others succeed, the post is marked as a partial failure and you can retry just the failed ones.</p>
"""),
        ("recovery", "Unsaved work", """
<p>If you leave the composer with unsaved changes, Sync Socials keeps a copy on that browser and offers to restore it next time you open the composer for the same post. Files you selected from your device need to be chosen again.</p>
"""),
    ],
    related=("timezones.html", "media-requirements.html", "why-did-my-post-fail.html"),
)

page(
    "timezones.html",
    group="Publishing",
    kicker="Scheduling",
    title="Timezones and scheduled times",
    description="Scheduled times are read in your workspace timezone. Learn where to set it, how daylight saving is handled, and what changing it does to existing posts.",
    lead="Every scheduled time belongs to the workspace timezone, not to the browser you happen to be using.",
    sections=[
        ("where", "Where the timezone lives", f"""
<p>New workspaces start in America/New_York until you confirm a timezone on the getting-started card or in <a href="{SETTINGS}">Settings → Workspace</a>. The composer and calendar always show the active timezone next to times, so a mismatch is visible before you schedule.</p>
"""),
        ("change", "Changing it later", """
<p>Changing the workspace timezone affects posts you schedule from then on. Posts already in the queue keep the exact moment they were scheduled for; open and reschedule them if they should move.</p>
"""),
        ("dst", "Daylight saving time", """
<p>Times are stored as exact instants, so a post scheduled for 9:00 AM stays at 9:00 AM local time across a daylight-saving change in that timezone. Posted shows the delivered time in the workspace timezone.</p>
"""),
        ("agents", "AI agents", """
<p>When an agent schedules a post, it names the timezone explicitly. If you ask for “tomorrow at 9”, make sure the agent uses your workspace timezone; the guides for ChatGPT and Claude show phrasing that avoids the ambiguity.</p>
"""),
    ],
    related=("schedule-and-publish.html", "getting-started.html"),
)

page(
    "media-requirements.html",
    group="Publishing",
    kicker="Media",
    title="Media requirements by platform",
    description="Upload limits, accepted formats, images per post, aspect ratios, and video rules for every platform Sync Socials publishes to.",
    lead="Sync Socials checks media against each selected platform before anything is sent, and converts what it can. These are the rules it applies.",
    sections=[
        ("uploads", "Uploads", """
<ul>
  <li>Up to <strong>10 files per upload</strong>, <strong>25 MB per image</strong>, <strong>250 MB per video</strong>, and 250 MB per upload in total.</li>
  <li>Images: JPEG, PNG, WebP, GIF. Videos: MP4, M4V, MOV. MOV and other QuickTime files are converted to H.264 MP4 automatically.</li>
  <li>Large videos are accepted first and normalized in the background; the post shows as processing until that finishes.</li>
  <li>Everything you upload lands in the <strong>Media library</strong> and can be reused in later posts. Media attached to a draft or scheduled post can't be deleted until the post no longer needs it.</li>
</ul>
"""),
        ("images", "Images per post", """
<ul>
  <li><strong>Facebook and Instagram:</strong> up to 10 images.</li>
  <li><strong>X:</strong> up to 4 images, no animated GIFs.</li>
  <li><strong>LinkedIn, Telegram, Discord, Slack:</strong> 1 image. The composer refuses a multi-image post to these instead of dropping images.</li>
  <li><strong>TikTok:</strong> photo posts are resized to fit TikTok's 1080p bounds.</li>
</ul>
<p>Instagram requires images between <strong>4:5 and 1.91:1</strong>. The composer flags images outside that range and lets you choose a crop focus; the crop is applied only to the Instagram copy.</p>
"""),
        ("video", "Video", """
<ul>
  <li><strong>YouTube:</strong> video only. Title from the campaign title, description from the caption, optional custom thumbnail.</li>
  <li><strong>Instagram and Facebook:</strong> videos publish as Reels when they meet the platform's rules; otherwise Facebook publishes a regular video post.</li>
  <li><strong>X:</strong> one video up to 140 seconds and 50 MB.</li>
  <li><strong>TikTok:</strong> one video; TikTok finishes processing after upload.</li>
  <li><strong>LinkedIn:</strong> video isn't supported yet.</li>
</ul>
"""),
        ("captions", "Captions", """
<ul>
  <li><strong>X:</strong> 280 weighted characters including hashtags; links and emoji count differently.</li>
  <li>Other platforms' caption limits are shown in the composer under the destination list when the selected account needs them.</li>
</ul>
"""),
    ],
    related=("schedule-and-publish.html", "connect-x.html", "connect-facebook-instagram.html"),
)

page(
    "why-did-my-post-fail.html",
    group="Publishing",
    kicker="Troubleshooting",
    title="Why did my post fail?",
    description="Read the delivery result on Posted, fix the usual causes, and retry safely without creating duplicates.",
    lead="Every destination records its own result, so start by reading what the platform actually said.",
    sections=[
        ("read", "Read the result", f"""
<p>Open <a href="{POSTED}">Posted</a>. Each post shows <strong>Delivered clean</strong>, <strong>Partial issues</strong>, or <strong>Needs review</strong>, with the platform's message under each destination. The Home page banner also shows recent failures.</p>
"""),
        ("causes", "Common causes", """
<ul>
  <li><strong>Needs reconnect:</strong> the platform token expired or was revoked. Reconnect the account in Connections; then retry.</li>
  <li><strong>Media rejected:</strong> wrong aspect ratio, too large, or an unsupported format for that platform. See the <a href="/help/media-requirements.html">media requirements</a>.</li>
  <li><strong>Caption too long</strong> for X, or missing the TikTok settings and music confirmation.</li>
  <li><strong>X allowance reached:</strong> publishing pauses until the daily or monthly reset.</li>
  <li><strong>Platform outage or rate limit:</strong> the worker retries temporary errors on its own; a post can show as processing for a while before it settles.</li>
</ul>
"""),
        ("retry", "Retry safely", """
<p><strong>Retry failed</strong> on Posted re-sends only the destinations that failed; destinations that succeeded aren't sent again. Before retrying a destination whose result is unclear, check the platform itself for the post so you don't create a duplicate. If a platform confirms the post exists, use the reconciliation panel on Posted to mark it delivered instead of resending.</p>
"""),
        ("processing", "Stuck on processing", """
<p>TikTok, Instagram Reels, and large video uploads finish on the platform's side after Sync Socials hands them over. A few minutes is normal. If a post is still processing after an hour, open it from Posted to see the latest status, and contact support with the post title if it doesn't settle.</p>
"""),
    ],
    related=("schedule-and-publish.html", "media-requirements.html", "connect-facebook-instagram.html"),
)

page(
    "content-studio-and-ai-keys.html",
    group="AI and agents",
    kicker="Content Studio",
    title="Content Studio and your own AI key",
    description="Generate campaign concepts, hooks, captions, and short vertical videos with your own OpenAI or Claude key. Sync Socials adds no markup.",
    lead="AI generation is optional. Everything else in Sync Socials works without a key; add one when you want the Studio to draft ideas and videos for you.",
    sections=[
        ("what", "What the Studio does", """
<ul>
  <li>Turns a short business brief or website into campaign concepts, each with a hook, a caption, and hashtags.</li>
  <li>Produces vertical videos from a chosen concept using the built-in reaction-clip library or footage you upload. Rendering from library clips is included at no extra cost.</li>
  <li>Saves the results as drafts. Nothing is scheduled or published until you approve it.</li>
</ul>
"""),
        ("keys", "Add your key", f"""
<p>Open <a href="{APP}/login?next=%2Fapp%2Fsettings%23content-keys">Settings → AI keys</a> and paste an <strong>OpenAI</strong> or <strong>Claude</strong> API key. Keys are encrypted and used only for your workspace's requests. Usage is billed by your provider at their rates; Sync Socials charges nothing on top.</p>
<p>Optional video generation uses Runway with your own Runway credits. Without it, video concepts keep the script and shot brief in the draft and render from library clips instead.</p>
"""),
        ("costs", "What it costs", """
<p>Concept generation uses a small amount of text model usage per run. Image generation and provider-rendered video cost whatever your provider charges; check your provider dashboard for exact pricing. Reaction-clip renders don't use your key.</p>
"""),
        ("agents", "Studio through your agent", """
<p>Connected agents can call the same concept and video tools. A workspace AI key is still required for generation; it isn't needed to save a caption, browse media, or schedule.</p>
"""),
    ],
    related=("ai-agents-and-mcp.html", "schedule-and-publish.html"),
)

page(
    "ai-agents-and-mcp.html",
    group="AI and agents",
    kicker="Agents",
    title="Use Sync Socials from ChatGPT, Claude, or any MCP agent",
    description="Connect the published ChatGPT app or Claude plugin, or use the hosted MCP server with an API key from Codex, Claude Code, OpenClaw, and other clients.",
    lead="Your agent can upload media, draft, schedule, publish, and check delivery, limited to the workspace you approve.",
    sections=[
        ("options", "Three ways to connect", """
<ul>
  <li><strong>ChatGPT:</strong> the published Sync Socials app. Sign in as the workspace owner and approve access; no API key needed. <a href="/chatgpt.html">ChatGPT setup guide</a>.</li>
  <li><strong>Claude Chat and Cowork:</strong> the published plugin with a custom connector. <a href="/claude.html">Claude setup guide</a>.</li>
  <li><strong>API-key clients</strong> such as Codex, Claude Code, and OpenClaw: install the agent skill and configure a workspace API key against the hosted MCP server. <a href="/ai-social-media-agent.html">Agent guide</a>.</li>
</ul>
"""),
        ("keys", "Workspace API keys", f"""
<p>Create a key in <a href="{APP}/login?next=%2Fapp%2Fsettings%23api">Settings → API</a>. The Growth plan includes one active key; revoking it stops every client using it immediately. Keep keys in the agent's environment, never in a prompt or a public repository.</p>
"""),
        ("safety", "What an agent can and can't do", """
<ul>
  <li>It works only inside the workspace you approved and only with accounts already connected in Connections. Agent access does not connect social accounts for you.</li>
  <li>Scheduling and publishing happen only when you ask. Drafts can be saved without a destination.</li>
  <li>Disconnect an agent any time from Settings → Connected agents. Scheduled posts stay in the queue.</li>
</ul>
"""),
    ],
    related=("content-studio-and-ai-keys.html", "timezones.html"),
)

page(
    "billing-trial-and-cancellation.html",
    group="Account and billing",
    kicker="Billing",
    title="Pricing, the free trial, and cancelling",
    description="Exploring free, when the 7-day trial starts, what Growth and Agency cost, how to cancel, and what happens to your workspace afterwards.",
    lead="Explore free, start the trial when you are ready to publish, and cancel from the billing portal whenever you like.",
    sections=[
        ("free", "Exploring free", """
<p>Every new account starts free with no card: connect one account per platform (X excluded), upload media, and keep unlimited drafts.</p>
<p>Scheduling or publishing a post saves it as a draft and offers the 7-day trial. API access and the Content Studio need a paid plan or the trial.</p>
"""),
        ("trial", "The 7-day trial", f"""
<p>When you're ready to schedule and publish, start the trial from the banner or from <a href="{BILLING}">Billing</a>. Stripe takes a card, charges $0 today, and the subscription renews when the trial ends unless you cancel first: <strong>$19.95 per month</strong> or <strong>$199.50 per year</strong> on Growth, <strong>$39.99 per month</strong> or <strong>$399 per year</strong> on Agency. X publishing isn't included during the trial.</p>
<p>The trial is for your first paid plan only; Stripe confirms eligibility and the first payment date on the checkout page.</p>
"""),
        ("plan", "Growth and Agency", """
<p><strong>Growth</strong> includes:</p>
<ul>
  <li>Unlimited scheduling and drafts, with no per-post fees.</li>
  <li>Up to 20 connected accounts per platform.</li>
  <li>Every live platform, plus the X allowance after the trial.</li>
  <li>Media library, calendar, analytics for Facebook, Instagram, and YouTube, and delivery tracking for everything.</li>
  <li>MCP and API access with one active API key.</li>
</ul>
<p><strong>Agency</strong> adds everything a team needs:</p>
<ul>
  <li>Invite up to 4 team members (5 seats) to work in the same workspace.</li>
  <li>Up to 50 connected accounts per platform.</li>
  <li>Three active API keys, so each tool or agent gets its own.</li>
  <li>Priority support from the founder.</li>
</ul>
<p>If Agency isn't offered on your Billing page yet, it's still rolling out; email support and we'll set it up for you.</p>
"""),
        ("manage", "Change plan, update card, or cancel", f"""
<p>The workspace owner opens <a href="{BILLING}">Billing</a> and chooses <strong>Open billing portal</strong>. The Stripe portal handles payment methods, invoices, switching between monthly and yearly, and cancellation. Cancelling takes effect at the end of the paid period; you keep access until then.</p>
"""),
        ("after", "After a subscription ends", """
<p>The workspace locks: Billing, Settings, and Referrals stay open, and your drafts, media, and history are kept, but scheduling and publishing stop and queued posts aren't sent. Subscribing again from Billing unlocks everything as it was.</p>
"""),
        ("refunds", "Refunds and billing questions", f"""
<p>Email <a href="{SUPPORT}?subject=Billing%20question">contactsyncsocials@gmail.com</a> from the account email with your workspace name. Refund requests are reviewed by a person; the billing portal and your Stripe receipts are the record of what was charged.</p>
"""),
    ],
    related=("getting-started.html", "connect-x.html"),
)

page(
    "team-and-security.html",
    group="Account and billing",
    kicker="Account",
    title="Workspace roles, security, and your data",
    description="How workspaces and roles work, how connected-account credentials are protected, and how to disconnect accounts or delete data.",
    lead="Your workspace holds everything; your login is just the way in.",
    sections=[
        ("roles", "Workspaces and roles", f"""
<p>Each account starts with one workspace. The <strong>Owner</strong> manages billing, connections, API keys, AI keys, and the team. <strong>Members</strong> draft, schedule, and publish with the accounts the owner connected, and can't change billing or connections.</p>
<p>On the <strong>Agency</strong> plan the owner invites people from <a href="{SETTINGS}#team">Settings → Team</a>: enter an email address, and that person signs up with the same address to land in the workspace automatically. Agency includes five seats; the owner can remove a member at any time. An address that already owns its own Sync Socials workspace can't be invited yet, because workspace switching isn't available.</p>
"""),
        ("security", "How credentials are protected", f"""
<ul>
  <li>Social accounts connect through each platform's own sign-in. Sync Socials never sees or asks for a social-network password.</li>
  <li>Platform tokens, bot tokens, and webhook URLs are stored encrypted and used only to publish and read performance for your workspace.</li>
  <li>Signing out of the browser doesn't disconnect your agents or other devices; manage those in <a href="{SETTINGS}">Settings</a>.</li>
</ul>
"""),
        ("remove", "Disconnecting and deleting", f"""
<p>Disconnect any account from <a href="{CONNECTIONS}">Connections</a>. Posts already published stay on the platform. To delete workspace data or your whole account, follow the <a href="/data-deletion.html">data deletion instructions</a>. The <a href="{APP}/privacy">privacy policy</a> describes what is stored and for how long.</p>
"""),
    ],
    related=("billing-trial-and-cancellation.html", "connect-youtube.html"),
)

GROUPS = [
    ("Start here", "New to Sync Socials? Begin with these."),
    ("Connect your accounts", "Every platform Sync Socials publishes to, with the requirements and the usual fixes."),
    ("Publishing", "The composer, scheduling, media rules, and what to do when a post fails."),
    ("AI and agents", "Optional AI generation with your own key, and running Sync Socials from an agent."),
    ("Account and billing", "Pricing, the trial, cancelling, roles, and your data."),
]


def index_page():
    cards = ""
    for name, blurb in GROUPS:
        items = ""
        for slug, meta in PAGES.items():
            if meta["group"] != name:
                continue
            items += f'<a class="help-card" href="/help/{slug}"><strong>{html.escape(meta["title"])}</strong><span>{html.escape(meta["description"])}</span></a>'
        cards += f'<section class="help-group"><h2>{html.escape(name)}</h2><p class="help-group__blurb">{html.escape(blurb)}</p><div class="help-grid">{items}</div></section>'
    return f"""  <main class="help-home">
    <section class="section">
      <div class="container">
        <div class="section-head">
          <p class="kicker">Help center</p>
          <h1>How can we help?</h1>
          <p class="lead">Setup guides, platform rules, and fixes for the problems people actually hit. If a guide doesn't answer it, <a href="{SUPPORT}">email the founder</a>.</p>
        </div>
        {cards}
        <section class="help-group">
          <h2>More</h2>
          <div class="help-grid">
            <a class="help-card" href="/chatgpt.html"><strong>ChatGPT setup guide</strong><span>Connect the published ChatGPT app to your workspace.</span></a>
            <a class="help-card" href="/claude.html"><strong>Claude setup guide</strong><span>Install the plugin for Claude Chat and Cowork.</span></a>
            <a class="help-card" href="/data-deletion.html"><strong>Data deletion</strong><span>Disconnect accounts and request deletion of workspace data.</span></a>
            <a class="help-card" href="/referral.html"><strong>Partner program</strong><span>Earn 30% recurring commission by referring creators.</span></a>
          </div>
        </section>
      </div>
    </section>
  </main>
"""


def main():
    site = sys.argv[1]
    out = os.path.join(site, "help")
    os.makedirs(out, exist_ok=True)
    written = []
    for slug, meta in PAGES.items():
        doc = head(slug, meta["title"], meta["description"], breadcrumb=meta["title"]) + guide(
            slug, meta["kicker"], meta["title"], meta["lead"], meta["sections"], meta["related"]
        ) + FOOTER
        with open(os.path.join(out, slug), "w") as fh:
            fh.write(doc)
        written.append(slug)
    doc = head("index.html", "Help center", "Setup guides, platform rules, and troubleshooting for Sync Socials.") + index_page() + FOOTER
    with open(os.path.join(out, "index.html"), "w") as fh:
        fh.write(doc)
    written.append("index.html")
    print("\n".join(written))


if __name__ == "__main__":
    main()
