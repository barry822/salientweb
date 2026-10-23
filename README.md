# Salient website — files & hosting guide

A premium single-page site for Salient — managed, multi-channel B2B outbound.
Positioning: **pay for outcomes, not headcount.**

```
salientweb/
├── index.html     The site (hero + calendar + how we fill your calendar + pay for
│                  outcomes + three ways + results + pilot + FAQ + contact/booking)
├── 404.html       "Page not found" page
├── styles.css     Brand design system
├── script.js      Scroll animations, counters, booking slots, form handling
├── robots.txt     Lets search engines in, points to the sitemap
├── sitemap.xml    The page list for Google / Bing
├── README.md      This guide
├── booking-setup/
│   └── Code.gs    Google Meet booking script (paste into Apps Script; don't upload)
└── assets/
    ├── salient-logo.png        (colour logo, for light backgrounds)
    ├── salient-logo-white.png  (white logo, for dark backgrounds)
    ├── favicon.svg / favicon.png / favicon-32.png   (browser-tab and Google icons)
    ├── apple-touch-icon.png    (iPhone home-screen icon)
    └── og-image.png            (1200×630 preview when the link is shared)
```

Brand colours: royal blue `#2433DB`, electric blue `#3E54FF`, green `#22B026`, deep navy `#090B22`.
Font: Geist (headings and body), loaded from Google Fonts.

The hero numbers (1,240 → 612 → 342 → 87 → 31) are **illustrative UI mock data**, labelled as such — they are not presented as Salient's actual results. The ChargingAdda figures in the Results section are the real case-study numbers from your deck.

---

## Step 1 — Connect the contact form (5 min, do this first)

The form uses **Formspree** (free, no server — submissions land in your inbox).

1. Go to **formspree.io** → sign up (free tier = 50 submissions/month).
2. Create a **New Form**, set "Send to" = **sales@salientco.in**.
3. Copy your endpoint — it looks like `https://formspree.io/f/abcdwxyz`.
4. Open **index.html**, find:

   ```html
   <form id="contact-form" class="form-card reveal" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

   Replace `YOUR_FORM_ID` with your real ID, e.g. `action="https://formspree.io/f/abcdwxyz"`.
5. Save. The first real submission triggers a one-time confirmation email from Formspree — confirm it once and you're live.

Until then, the form shows a friendly "not connected yet" message instead of failing silently.

---

## Step 1b — Google Meet booking for the time slots (15 min)

The time slots on the contact form book a real 30-minute Google Meet on your calendar.
A small Google Apps Script (free, runs on your Google account) does the booking:
it shows only times you're free, creates the calendar event with a Meet link, and Google
emails the invite to the visitor. Formspree still gets a copy of every booking.

Use the Google account whose calendar should receive the calls (ideally the one behind sales@salientco.in).

1. Go to **script.google.com** → **New project**. Name it "Salient booking".
2. Delete the sample code, then paste in everything from **`booking-setup/Code.gs`**.
3. Left sidebar → **Services** → **+** → **Google Calendar API** → **Add**.
3b. **Authorise calendar access once:** pick **`doGet`** in the function dropdown → **Run** →
    **Review permissions** → your account → (if shown) **Advanced → Go to Salient booking** → **Allow**.
    Without this the site gets "You do not have permission to call calendar.freebusy.query".
4. **Deploy** → **New deployment** → gear icon → **Web app**.
   Description "Salient booking", **Execute as: Me**, **Who has access: Anyone** → **Deploy**.
   Approve the permissions (calendar access) when Google asks.
5. Copy the **Web app URL** (it ends in `/exec`).
6. In **index.html**, find `data-booking="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"`
   on the contact form and replace the whole URL with yours.
7. Test: open the site, pick a slot, book with your own email. You should get a calendar
   invite with a Google Meet link, and the slot shows as "Taken" afterwards.

**Settings** (top of `Code.gs`): call length, start times (default 11:00 and 16:00 IST),
how many working days ahead (default 3), and an optional colleague to invite.
If you change the times or number of days, change `SLOT_TIMES` / `WORKING_DAYS` in
`script.js` to match. After editing `Code.gs`, use **Deploy → Manage deployments → Edit →
New version** so the same URL picks up the change.

Until the URL is set, picking a slot just sends the preferred time to you through Formspree.

> Don't upload the `booking-setup` folder to Cloudflare — it's only for pasting into Apps Script.

---

## Step 2 — Put the site online (free, with HTTPS)

**Recommended host: Cloudflare Pages** — free, fast worldwide, automatic HTTPS, works cleanly with a GoDaddy domain. You do *not* need to pay GoDaddy for hosting.

1. Create a free account at **dash.cloudflare.com**.
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
3. Project name `salient`. Drag the **contents of the `salientweb` folder** (the files + the `assets` folder, but not `booking-setup`) into the box → **Deploy**.
4. You'll get a live URL like `salient.pages.dev`. Open it, test the page and the form.

*(Netlify works the same way: netlify.com → "Add new site" → "Deploy manually" → drag the folder.)*

---

## Step 3 — Point salientco.in (GoDaddy) at your site

Let Cloudflare manage DNS — you keep the domain at GoDaddy and only change its nameservers.

1. In Cloudflare: **Add a site** → `salientco.in` → **Free** plan. Cloudflare scans your DNS.
2. It gives you **two nameservers** (e.g. `dana.ns.cloudflare.com`, `rob.ns.cloudflare.com`).
3. In **GoDaddy**: your domain → **DNS** → **Nameservers** → **Change** → **"I'll use my own nameservers"** → paste the two Cloudflare nameservers → **Save**. (Propagation: minutes to a few hours.)
4. Back in Cloudflare → your **Pages project** → **Custom domains** → add **`salientco.in`** and **`www.salientco.in`**. Cloudflare creates the records and the SSL certificate automatically.

`https://salientco.in` now serves your site with a valid certificate.

> Prefer to leave nameservers at GoDaddy? GoDaddy can't point the *root* domain at Pages cleanly (only `www`). For a root domain that just works with HTTPS, use the Cloudflare-nameserver route above.

---

## Updating later

- **Edit text / copy:** open `index.html` in any editor and change the words — no build step.
- **Redeploy:** re-open the Cloudflare/Netlify project and upload the folder again. Redeploys in seconds.

## If you ever want GoDaddy's own hosting instead

Only worth it if you already pay for a GoDaddy hosting plan. Then: cPanel → **File Manager** → `public_html` → upload all files + the `assets` folder. HTTPS is via GoDaddy's SSL (sometimes a paid add-on). The free Cloudflare route avoids all of that.

---

## SEO & discoverability (already built in)

- **Title + meta description** tuned for "B2B pipeline / managed outbound / pay for outcomes".
- **Canonical URL** (`https://salientco.in/`) so www / non-www / trailing-slash variants don't split ranking signals.
- **Structured data (JSON-LD, `ProfessionalService`)** — name, logo, description, email, Bengaluru address, services — so Google and AI search understand what Salient is.
- **Open Graph + Twitter cards** with a branded 1200×630 preview image (`assets/og-image.png`), so the link looks good when shared on LinkedIn, WhatsApp, X, etc.
- **`sitemap.xml`** and **`robots.txt`** in the site root.
- **Semantic landmarks** (`<header>`, `<main>`, `<footer>`, labelled nav), one `<h1>`, clean heading order.
- **Short, keyword-relevant URL** (single page at the root) — nothing is more than one click away.
- **Structured data for the FAQ** (`FAQPage`) and the site (`WebSite`), matching the visible text word for word.
- **`404.html`** — a real "page not found" page. Without it, Cloudflare Pages serves the home page for every mistyped URL, which Google sees as duplicate content.
- **Real numbers in the HTML** — the pipeline, target-list and case-study figures are in the page source; the animation only resets them to 0 in the browser.
- **Icons** — `favicon.svg` (sharp at any size), `favicon.png` (512px, used by Google in search results), `favicon-32.png`, and `apple-touch-icon.png` for iPhone home screens.
- **Image sizes set** on every `<img>`, so the page doesn't jump while loading.

> As the business grows, the biggest SEO lever is **content**: a few resource/blog pages on topics your buyers search (e.g. "how to build B2B pipeline without hiring SDRs"), each linking back to the homepage. That's when a multi-page structure, categories and internal linking start to matter. Happy to build that when you're ready.

---

## Launch checklist (the 10 standard pre-launch items, mapped to this site)

| # | Item | Status |
|---|------|--------|
| 1 | **SSL / HTTPS** | ✅ Automatic & free on Cloudflare Pages (Step 2–3). Nothing to buy. |
| 2 | **Backup** | ✅ Your source of truth is this folder / the zip. Keep a copy; or push to a free GitHub repo for version history. |
| 3 | **Analytics** | ⚙️ *One step at launch.* A Google Analytics 4 snippet is pre-placed in `index.html` (commented out). Create a free GA4 property at analytics.google.com, copy your `G-XXXXXXXXXX` Measurement ID into both spots, and remove the comment markers. |
| 4 | **Mobile & browser compatibility** | ✅ Responsive, tested at phone width; standard CSS works across Chrome, Safari, Edge, Firefox. |
| 5 | **Broken links** | ✅ All in-page links verified — no dead anchors. |
| 6 | **XML sitemap → search engines** | ⚙️ `sitemap.xml` is included. At launch, add the site in **Google Search Console** and **Bing Webmaster Tools** and submit `https://salientco.in/sitemap.xml`. |
| 7 | **User experience** | ✅ Simple nav, prominent repeated CTA, clear visual hierarchy, compressed images. |
| 8 | **Quality content** | ✅ Original, outcome-focused copy throughout. |
| 9 | **SEO basics** | ✅ See the SEO section above (on-page + technical). Off-page (backlinks) comes with promotion. |
| 10 | **Promote** | ⚙️ Your call post-launch: LinkedIn, email signature, outbound footer, the deck. |

**So, to go live you need to:** (1) plug in the Formspree ID, (2) deploy to Cloudflare Pages, (3) point the GoDaddy nameservers, (4) add your GA4 ID, (5) submit the sitemap in Search Console. Steps 1–3 are above; 4–5 are items 3 and 6 here.

### How to get a GA4 Measurement ID
1. Go to **analytics.google.com** → **Admin** → **Create** → **Property**.
2. Name it "Salient", set your timezone/currency → create a **Web** data stream for `https://salientco.in`.
3. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`).
4. In `index.html`, find the `ANALYTICS` comment block, paste the ID in both places, and delete the `<!--` / `-->` lines around it.
