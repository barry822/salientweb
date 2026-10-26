# Salient website

The site for Salient — managed, multi-channel B2B outbound. Positioning: **pay for outcomes, not headcount.**

Built with **Next.js** (static export) and **three.js** (the 3D funnel), hosted on **Cloudflare**.
`npm run build` turns it into plain HTML/CSS/JS in `out/`, which Cloudflare serves. There is no server:
booking runs on a Google Apps Script, the form copy goes to Formspree.

```
salientweb/
├── app/
│   ├── layout.tsx           Page <head>: title, description, share tags, icons, font, analytics
│   ├── page.tsx             The home page (every section's text lives here)
│   ├── globals.css          Brand design system and all section styles
│   ├── not-found.tsx        "Page not found" (exported as 404.html)
│   └── bot/page.tsx         /bot — the SalientBot crawler page
├── components/
│   ├── Funnel.tsx           "How we fill your calendar": the five step cards + scroll tracking
│   ├── funnelScene.ts       The three.js funnel itself (tiers, lead particles, glow)
│   ├── BookingForm.tsx      Contact form, IST time slots, Google Meet booking, Formspree copy
│   ├── Effects.tsx          Scroll effects: nav, progress rail, invoice, calendar, counters
│   └── Mark.tsx             The Salient arrow (SVG)
├── public/                  Copied to the site as-is
│   ├── assets/              Logos, client logos, icons, share image
│   ├── robots.txt, sitemap.xml
│   └── google794876f8de6566a1.html   Google Search Console verification — keep it
├── booking-setup/Code.gs    Google Meet booking script (paste into Apps Script; not deployed)
├── next.config.mjs          output: 'export' (static site)
└── .node-version            Node 22 for the Cloudflare build
```

Brand colours: royal blue `#2433DB`, electric blue `#3E54FF`, green `#22B026`, deep navy `#090B22`.
Font: Geist, self-hosted at build time.

The hero and funnel numbers (1,240 → 612 → 342 → 87 → 31, the 2,140 target list) are **illustrative**, labelled as such.
The ChargingAdda figures in the Results section are the real case-study numbers.

---

## Working on the site

Needs [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install          # once
npm run dev          # live preview at http://localhost:3000, reloads as you save
npm run build        # the real build, into out/
npm run preview      # serve out/ at http://localhost:3000 to check the build
```

- **Change text:** most copy is in `app/page.tsx`; the five funnel steps are in `components/Funnel.tsx` (`STEPS`).
- **Publish:** commit and push to `main`. Cloudflare builds and deploys it automatically.

---

## Deploying on Cloudflare

The site is the Cloudflare **Worker `salientweb`**, connected to this GitHub repo: every push to `main`
builds and goes live; pushes to other branches build a preview version without touching the live site.

`wrangler.jsonc` tells the Worker to serve `out/`, to answer unknown URLs with `out/404.html`, and to
serve `/bot` from `bot.html`. Build settings (**Workers & Pages → salientweb → Settings → Build**):

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` (the default) |
| Root directory | `/` (leave empty) |
| Node version | from `.node-version` (22); if ignored, add the build variable `NODE_VERSION` = `22` |

Check locally exactly as Cloudflare will serve it: `npm run build` then `npx wrangler dev`.

### Domain
`salientco.in` is attached as a custom domain on the Cloudflare project (DNS is on Cloudflare).
`www.salientco.in` should redirect to it: a proxied DNS record **A `www` → `192.0.2.1`** plus the
**Rules → Redirect Rules → "Redirect from WWW to root"** template.

---

## Contact form and Google Meet booking

The form lives in `components/BookingForm.tsx`; the two addresses are at the top of that file:

- `FORMSPREE` — every request is copied to sales@salientco.in via [Formspree](https://formspree.io).
- `BOOKING` — the Google Apps Script web app that books the meeting.

The time slots are the next 3 working days at 11:00 and 16:00 IST. They come from your Google Calendar,
taken ones are greyed out, and booking one creates a 30-minute event with a Google Meet link; Google emails
the invite to the visitor.

**Setting up (or redoing) the booking script:**

1. **script.google.com** → **New project** ("Salient booking"), using the Google account whose calendar gets the calls.
2. Paste in everything from **`booking-setup/Code.gs`**.
3. **Services** → **+** → **Google Calendar API** → **Add**.
4. **Authorise calendar access once:** pick **`doGet`** in the function dropdown → **Run** → **Review permissions** →
   your account → (if shown) **Advanced → Go to Salient booking** → **Allow**.
   Without this the site gets "You do not have permission to call calendar.freebusy.query".
5. **Deploy** → **New deployment** → **Web app**: **Execute as: Me**, **Who has access: Anyone** → **Deploy**.
   ("Anyone within salientco.in" will *not* work: visitors would be sent to a Google sign-in page.)
6. Copy the **Web app URL** (ends in `/exec`, use the `script.google.com/macros/s/…` form) into `BOOKING`.
7. Test: book a slot with your own email; you should get a Meet invite and the slot shows "Taken".

**Settings** (top of `Code.gs`): call length, start times, working days ahead, an extra guest.
If you change the times or days, change `SLOT_TIMES` / `WORKING_DAYS` in `BookingForm.tsx` to match.
After editing `Code.gs`: **Deploy → Manage deployments → Edit → New version** (the URL stays the same).

---

## SEO (built in)

- Keyword title and description; canonical URL `https://salientco.in/`.
- Structured data: `ProfessionalService`, `WebSite` and `FAQPage` (matches the visible FAQ word for word).
- Open Graph / Twitter share cards with a 1200×630 image (`public/assets/og-image.png`).
- `sitemap.xml`, `robots.txt`, a real 404 page (so mistyped URLs aren't duplicate home pages).
- Real figures in the HTML (the animations only reset them to 0 in the browser).
- Icons for browser tabs, Google results and iPhone home screens; sizes set on every image.

### Still to do at launch
1. **Google Search Console:** add a **Domain** property for `salientco.in` and verify it with the DNS record it gives you
   (Search Console can add it to Cloudflare for you); that covers www, http and https at once. Then submit
   `https://salientco.in/sitemap.xml`. Same in Bing Webmaster Tools. (The HTML-file method also works in principle,
   but Cloudflare serves `/google…html` via a redirect to `/google…`, which Google's check may not accept.)
2. **Analytics:** create a GA4 property at analytics.google.com → copy the Measurement ID (`G-XXXXXXXXXX`)
   into `GA_ID` at the top of `app/layout.tsx`, then commit and push.
3. **LinkedIn company page:** send the URL to add it to the structured data.

> The biggest SEO lever from here is **content**: a few pages on what your buyers search for
> (e.g. "how to build B2B pipeline without hiring SDRs"), each linking back to the home page.
