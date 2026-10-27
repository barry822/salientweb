import type { Metadata } from 'next';
import { Mark, MarkSprite } from '@/components/Mark';
import s from './not-found.module.css';

// exported as out/404.html, which Cloudflare serves for any URL that doesn't exist
export const metadata: Metadata = { title: 'Page not found | Salient', robots: { index: false } };

export default function NotFound() {
  return (
    <main className={`dark ${s.nf}`}>
      <MarkSprite />
      <div className="orb o1" aria-hidden="true" /><div className="orb o2" aria-hidden="true" />
      <Mark className={s.mark} />
      <div className="wrap">
        <a className={s.logo} href="/" aria-label="Salient home">
          <img src="/assets/salient-logo-white.png" alt="Salient" width={640} height={404} />
        </a>
        <h1 className={s.h1}>This page doesn’t exist. <span className="h1-soft">Your pipeline still can.</span></h1>
        <p className={s.p}>The link may be old or mistyped. Everything about Salient is on our home page.</p>
        <div className={s.cta}>
          <a className="btn" href="/">Go to the home page</a>
          <a className="btn btn--ghost" href="/#contact">Book a scoping call</a>
        </div>
      </div>
    </main>
  );
}
