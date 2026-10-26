import type { Metadata } from 'next';
import { Mark, MarkSprite } from '@/components/Mark';
import s from './bot.module.css';

export const metadata: Metadata = {
  title: 'SalientBot | Salient',
  description: "SalientBot is Salient's web crawler. What it reads, how it behaves, and how to ask it to stay away from your website.",
  alternates: { canonical: '/bot' },
};

const MAIL = 'sales@salientco.in';

export default function Bot() {
  return (
    <main className={s.bot}>
      <MarkSprite />
      <div className="orb o1" aria-hidden="true" /><div className="orb o2" aria-hidden="true" />
      <Mark className={s.mark} />
      <div className={s.wrap}>
        <a href="/" className={s.logo} aria-label="Salient home"><img src="/assets/salient-logo-white.png" alt="Salient" width={640} height={404} /></a>
        <h1>SalientBot</h1>
        <p className={s.lede}>SalientBot is Salient’s web crawler. If you found this page in your server logs, this is who visited
          your website, why, and how to ask us to stay away.</p>

        <h2>Who runs it</h2>
        <p>Salient, a B2B outbound and lead generation company in Bengaluru, India. You can reach us at <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>

        <h2>What it does</h2>
        <p>It reads public pages of company websites to learn about the business: what it sells and to whom, where it is,
          roughly how large it is, the technologies on its site, and the jobs it is hiring for. We use this to judge which
          companies may be a good fit for the businesses we work with.</p>
        <p>It reads a handful of pages per company: the home page, and pages such as about, team, contact and careers.
          It does not crawl whole websites.</p>

        <h2>How it behaves</h2>
        <ul>
          <li>It names itself in every request. Its user agent contains <code>SalientBot</code> and a link to this page.</li>
          <li>It reads your <code>robots.txt</code> first and follows it, both the rules for <code>SalientBot</code> and the rules
            for all bots. It honours <code>Crawl-delay</code>.</li>
          <li>It visits slowly: one visit to a website at a time, at least a minute between visits, and a few seconds between
            pages. If your site answers <code>429</code> or <code>503</code>, it waits for your <code>Retry-After</code>.
            If it answers <code>401</code> or <code>403</code>, it stays away for a week.</li>
          <li>It never logs in, never fills in forms, never solves CAPTCHAs, and never disguises itself or uses proxies.</li>
          <li>It reads only HTML and text, at most a few megabytes a page.</li>
        </ul>

        <h2>What we keep</h2>
        <ul>
          <li>Facts about the company, and the names and job titles of leaders that the website itself lists.</li>
          <li>Shared company addresses such as info@ or sales@, never a person’s email address taken from a website.</li>
          <li>A log of the pages visited (address, status and the first few hundred characters), kept for 90 days. We don’t
            store copies of your pages.</li>
        </ul>

        <h2>How to ask it to stay away</h2>
        <p>Add this to your website’s <code>robots.txt</code>. SalientBot checks it before every visit:</p>
        <pre>{'User-agent: SalientBot\nDisallow: /'}</pre>
        <p>Or email <a href={`mailto:${MAIL}?subject=SalientBot%20opt-out`}>{MAIL}</a> with your domain.
          We add it to our do-not-visit list, and SalientBot won’t read it again.</p>

        <p className={s.note}>Questions about the data we hold about your company, or a request to remove it: write to <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>
      </div>
    </main>
  );
}
