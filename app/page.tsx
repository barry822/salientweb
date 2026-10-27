import type { CSSProperties } from 'react';
import { Mark, MarkSprite } from '@/components/Mark';
import Funnel from '@/components/Funnel';
import BookingForm from '@/components/BookingForm';
import Effects from '@/components/Effects';

const FAQ = [
  ['What does Salient do?', 'We run your entire outbound function: building target-account lists, reaching decision-makers across calls, email and LinkedIn, qualifying real buying intent, and placing qualified meetings in your pipeline.'],
  ['How is this different from hiring SDRs?', "You don't carry salaries, tools, ramp time or attrition. You get a fully run outbound function that's live from week one, and you pay for the qualified meetings it produces."],
  ['Which companies do you work with?', 'Any B2B company with a sales-led motion: software, IT services, fintech, logistics, professional services and more.'],
  ['How does pricing work?', 'You pay per qualified meeting booked, with an optional success commission. We scope the commercials to your pilot on a short call.'],
  ['How do we get started?', 'A short scoping call to understand your ICP, then a pilot that proves what converts before you commit long term. Discovery usually starts within days of signing.'],
  ['What counts as a qualified meeting?', "A meeting with a decision-maker who has a real need this quarter and passes the criteria we agree with you up front. Anyone who doesn't fit stops at qualification and never reaches your calendar."],
  ['Is there a minimum commitment?', 'You start with a pilot. Month one tests several segments and gives you a written diagnosis, and you commit to more only once the numbers prove out.'],
];

const JSON_LD = [
  { '@context': 'https://schema.org', '@type': 'WebSite', '@id': 'https://salientco.in/#website', name: 'Salient', url: 'https://salientco.in/', publisher: { '@id': 'https://salientco.in/#org' } },
  {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': 'https://salientco.in/#org', name: 'Salient', legalName: 'Salient Private Limited', url: 'https://salientco.in/',
    logo: 'https://salientco.in/assets/salient-logo.png', image: 'https://salientco.in/assets/og-image.png',
    description: 'Managed, multi-channel B2B outbound. Salient builds and runs the outbound function and books qualified sales meetings; clients pay for outcomes, not headcount.',
    slogan: 'Pay for outcomes, not headcount.', email: 'sales@salientco.in', telephone: '+91-99807-89559',
    address: {
      '@type': 'PostalAddress', streetAddress: '2nd Floor, No. 129, 5th Main Rd, Above Bank of Baroda, 3rd Phase, J. P. Nagar',
      addressLocality: 'Bengaluru', addressRegion: 'Karnataka', postalCode: '560078', addressCountry: 'IN',
    },
    areaServed: 'IN', serviceType: ['B2B outbound', 'Lead generation', 'Appointment setting', 'GTM consulting'],
    knowsAbout: ['B2B outbound', 'B2B lead generation', 'sales pipeline generation', 'appointment setting', 'outsourced SDR', 'cold calling', 'cold email', 'LinkedIn outreach'],
  },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
];

// client logos: display height h sized so all logos look equally heavy
const CLIENTS = [
  { file: 'alaiy', name: 'alaiy', w: 85, h: 42 },
  { file: 'gokwik', name: 'GoKwik', w: 112, h: 32 },
  { file: 'nector', name: 'nector.io', w: 102, h: 35 },
  { file: 'revspot', name: 'Revspot', w: 189, h: 24 },
  { file: 'the-social-bid', name: 'The Social Bid', w: 60, h: 50 },
  { file: 'verifast', name: 'Verifast', w: 129, h: 28 },
];

// Salient vs an in-house team vs a typical agency
const COMPARE = [
  ['What you pay for', 'Qualified meetings booked, optional success commission', 'Salaries, tools and manager time', 'A monthly retainer or a price per lead'],
  ['Time to go live', 'Week one', 'Three to six months of hiring and ramp', 'A few weeks of setup'],
  ['Channels', 'Calls, email and LinkedIn as one sequence', 'Whatever your reps have time for', 'Often email only'],
  ['Data, dialer and tools', 'Included', 'You buy the licences', 'Sometimes extra'],
  ['Qualification', 'Checked on a call against your criteria', 'Depends on the rep', 'Form fills and replies, passed on as leads'],
  ['When someone leaves', 'The playbook and data stay', 'You rehire and ramp again', 'Your account gets a new manager'],
];

// "No black box" tabs, in the order of the views inside .rep__stage
const TOOLS = [
  ['Pipeline dashboard', 'Accounts reached, conversations, qualified meetings and pipeline added, every week.'],
  ['ICP mapping', 'Your market broken into segments by industry, size, city and buyer role, scored for fit before anyone is contacted.'],
  ['Account signals', 'Hiring, funding, leadership changes and web activity, ranked so the accounts showing intent are reached first.'],
];

const WAYS = [
  { id: 'w1', tag: 'You have no outbound', name: 'Build', sit: 'No SDRs, no outbound, no engine. We build it from zero.',
    lanes: [['s', 0, 80, 'Salient'], ['y', 80, 20, 'You']] as const,
    body: 'Salient does everything up to the close: the target list, the outreach, the calls and the booked meetings. Your team just takes the meeting.' },
  { id: 'w2', tag: 'You have a sales team', name: 'Supplement', sit: 'Your reps are busy closing. We add pipeline on top.',
    lanes: [['s', 0, 80, 'Salient, new channels'], ['y', 0, 100, 'Your team']] as const,
    body: "We run alongside your reps and open the channels they don't have time for. Every meeting we book is net new pipeline on top of what you already generate." },
  { id: 'w3', tag: 'Your funnel leaks', name: 'Fix', sit: "Outbound runs, but meetings don't convert. We find why.",
    lanes: [['s', 0, 60, 'Salient fixes'], ['y', 20, 80, 'Your team']] as const,
    body: "We diagnose what's breaking, whether that's the wrong ICP, weak positioning or loose qualification, and fix it. Same channels, sharper aim, meetings your team wants to take." },
];

export default function Home() {
  return (
    <>
      {JSON_LD.map((d, k) => (
        <script key={k} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <a className="skip" href="#main">Skip to content</a>
      <MarkSprite />

      <header className="nav top" id="nav">
        <div className="wrap nav__in">
          <a href="#top" className="nav__logo" aria-label="Salient home">
            <img className="logo-w" src="/assets/salient-logo-white.png" alt="Salient" width={640} height={404} />
            <img className="logo-c" src="/assets/salient-logo.png" alt="" width={640} height={404} />
          </a>
          <nav className="nav__links" aria-label="Primary">
            <a href="#how">How we build</a>
            <a href="#function">Why Salient</a>
            <a href="#proof">Results</a>
            <a href="#pilot">Pilot</a>
          </nav>
          <a className="btn btn--sm" href="#contact">Book a scoping call</a>
        </div>
      </header>

      <div className="rail" aria-hidden="true">
        <span className="rail__track"><span className="rail__fill" id="railFill" /></span>
        <Mark className="rail__mark" id="railMark" />
      </div>

      <main id="main">
        <span id="top" />

        {/* 1. HERO: the light and streaks are painted by Effects */}
        <section className="hero">
          <div className="wash" id="heroWash" aria-hidden="true" />
          <Mark className="hero__mark" id="heroMark" />
          <div className="wrap hero__copy">
            <p className="hero__badge"><b>ChargingAdda</b><span><em>3×</em> growth in sourced pipeline</span></p>
            <h1>We build your pipeline. <span className="h1-soft">You close the deals.</span></h1>
            <p className="lede">Salient runs your outbound end to end: the right accounts, the right people, real qualification, and sales meetings placed straight into your pipeline.</p>
            <div className="hero__cta">
              <a className="btn" href="#contact">Book a scoping call</a>
              <a className="btn btn--ghost" href="#how">See how we build it</a>
            </div>
          </div>
          <div className="hero__scroll" aria-hidden="true">Scroll<i /></div>
        </section>

        {/* trust: the logo list is repeated once so the scroll loops seamlessly */}
        <section className="trust">
          <div className="wrap trust__in">
            <p>Trusted by</p>
            <div className="marq" role="img" aria-label={'Clients: ' + CLIENTS.map((c) => c.name).join(', ')}>
              <ul aria-hidden="true">
                {[...CLIENTS, ...CLIENTS].map((c, k) => (
                  <li key={k}>
                    <img src={`/assets/clients/${c.file}.png`} alt={k < CLIENTS.length ? c.name : ''} width={c.w} height={c.h}
                      style={{ '--h': c.h } as CSSProperties} loading="lazy" decoding="async" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 2. NOT AN AGENCY */}
        <section className="what" id="calendar">
          <div className="wrap what__g">
            <div>
              <p className="what__pre">We&apos;re not an agency.</p>
              <h2>What if your calendar looked full, without a sales motion?</h2>
              <p className="what__body">No reports to read and no SDRs to manage. Just qualified meetings with buyers who fit, landing week after week, while your revenue line keeps climbing.</p>
              <ul className="ticks">
                <li>No SDR team to hire</li>
                <li>No outbound to manage</li>
                <li>Only qualified meetings, on your calendar</li>
              </ul>
            </div>
            <div className="cal" id="cal" data-depth=".04" aria-label="Example: a week full of qualified meetings and revenue rising">
              <div className="win__bar win__bar--l"><i /><i /><i /><span>salient / your calendar</span></div>
              <div className="cal__head">
                <div><b>This week</b><span id="calCount">0 qualified meetings</span></div>
                <span className="cal__legend"><i className="k1" />Demo<i className="k2" />Qualified<i className="k3" />Proposal</span>
              </div>
              <div className="cal__grid" id="calGrid" />
              <div className="rev">
                <div className="rev__l"><span>Pipeline value</span><b id="revVal">₹0L</b></div>
                <svg className="rev__chart" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22B026" stopOpacity=".25" /><stop offset="1" stopColor="#22B026" stopOpacity="0" /></linearGradient></defs>
                  <path id="revArea" d="M0 70 L0 62 L300 62 L300 70 Z" fill="url(#rf)" />
                  <path id="revLine" d="M0 62 L300 62" fill="none" stroke="#22B026" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>
              <p className="week__note">Illustrative example</p>
            </div>
          </div>
        </section>

        {/* 3. HOW WE FILL YOUR CALENDAR: the funnel */}
        <Funnel />

        {/* 4. PAY FOR OUTCOMES */}
        <section className="fn" id="function">
          <div className="fn__track" id="fnTrack">
            <div className="fn__sticky">
              <div className="wrap fn__g">
                <div className="fn__copy">
                  <p className="eyebrow">Pricing model</p>
                  <h2>Pay for outcomes, not headcount.</h2>
                  <p className="fn__intro">Salient is a function, not a headcount line. This is what outbound costs when you build it in-house. Scroll and watch what you stop paying for.</p>
                  <div className="fn__reasons" id="reasons">
                    <p className="on">Everything a strong in-house outbound team gives you, without carrying the team.</p>
                    <p>No salaries for reps who may never hit quota. Our people, our problem.</p>
                    <p>No manager time spent coaching, chasing and reporting on activity.</p>
                    <p>Data, dialers and sequencing tools come with the engine. No licences to buy.</p>
                    <p>No three-to-six-month ramp. Outbound runs from week one.</p>
                    <p>When someone leaves, the playbook and data stay. Attrition is never your reset button.</p>
                    <p className="fin">What&apos;s left is the only thing you wanted: qualified meetings with buyers who fit.</p>
                  </div>
                </div>
                <div className="paper-wrap" id="paper">
                  <span className="sheet s1" aria-hidden="true" /><span className="sheet s2" aria-hidden="true" />
                  <div className="inv" id="inv">
                    <div className="inv__head">
                      <div><span>Monthly cost of outbound</span><b id="invTitle">Building it in-house</b></div>
                      <Mark className="inv__mark" id="invMark" />
                    </div>
                    <ol className="inv__rows">
                      <li data-v="1.4"><span>2 SDR salaries</span><em>₹1.4L</em></li>
                      <li data-v="0.6"><span>Sales manager time</span><em>₹0.6L</em></li>
                      <li data-v="0.5"><span>Data, dialer and sequencing tools</span><em>₹0.5L</em></li>
                      <li data-v="1.2"><span>Ramp months with no pipeline</span><em>₹1.2L</em></li>
                      <li data-v="0.8"><span>Attrition and rehiring</span><em>₹0.8L</em></li>
                    </ol>
                    <div className="inv__total"><span>You pay for headcount</span><b id="invTotal">₹4.5L</b></div>
                    <p className="inv__note">Illustrative in-house costs for a two-rep team</p>
                  </div>
                  <div className="inv2" id="inv2" aria-hidden="true">
                    <div className="inv2__head">
                      <div><span>Monthly cost of outbound</span><b>Running it with Salient</b></div>
                      <img src="/assets/salient-logo.png" alt="Salient" width={640} height={404} loading="lazy" />
                    </div>
                    <ol>
                      <li className="key"><span>Qualified meetings booked</span><em>per meeting</em></li>
                      <li><span>Success commission</span><em>optional, on closed deals</em></li>
                      <li><span>SDR salaries</span><em>₹0</em></li>
                      <li><span>Data, dialer and sequencing tools</span><em>included</em></li>
                      <li><span>Ramp</span><em>live in week one</em></li>
                    </ol>
                    <div className="inv2__total"><span>You pay for</span><b>Outcomes</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. COMPARISON */}
        <section className="cmp" id="compare">
          <div className="wrap">
            <div className="sec-head rv">
              <p className="eyebrow">Comparison</p>
              <h2>Salient vs building it yourself.</h2>
              <p>Three ways to get outbound pipeline. Only one is priced on the meetings it produces.</p>
            </div>
            <div className="cmp__table rv" role="table" aria-label="Salient compared with an in-house SDR team and a typical lead-gen agency">
              <div className="cmp__row cmp__hd" role="row">
                <span role="columnheader" /><span className="us" role="columnheader"><Mark />Salient</span>
                <span role="columnheader">In-house SDR team</span><span role="columnheader">Typical lead-gen agency</span>
              </div>
              {COMPARE.map(([k, us, team, agency]) => (
                <div className="cmp__row" role="row" key={k}>
                  <b role="rowheader">{k}</b><span className="us" role="cell">{us}</span><span role="cell">{team}</span><span role="cell">{agency}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. THREE WAYS TO PLUG IN: the stage panel follows the selected card */}
        <section className="plug" id="plug-in">
          <div className="wrap">
            <div className="sec-head">
              <p className="eyebrow">Engagement models</p>
              <h2>Three ways to plug Salient in.</h2>
              <p>Wherever your pipeline is today, we take the outbound from there. In every model, you pay for outcomes.</p>
            </div>
            <div className="pv rv" id="pv" aria-hidden="true">
              <div className="pv__top">
                <div><span className="pv__k">Who runs each stage</span><b className="pv__mode" id="pvMode">{WAYS[0].name}</b><p className="pv__cap" id="pvCap">{WAYS[0].sit}</p></div>
                <div className="pv__legend"><span><i className="s" />Salient</span><span><i className="y" />Your team</span></div>
              </div>
              <div className="pv__track">
                <span className="pv__line"><i className="pv__dot" /><i className="pv__dot d2" /><i className="pv__dot d3" /></span>
                {['Target', 'Reach', 'Qualify', 'Book', 'Close'].map((st) => <div className="pv__st" key={st}><b /><span>{st}</span></div>)}
              </div>
              <div className="pv__lane"><span className="pv__bar s" id="pvS">Salient</span></div>
              <div className="pv__lane"><span className="pv__bar y" id="pvY">You</span></div>
              <p className="pv__foot" id="pvFoot">Salient runs 4 of 5 stages. You take the meeting.</p>
            </div>
            <div className="ways" id="ways">
              {WAYS.map((w) => (
                <article className="way" key={w.id}>
                  <button className="way__top" aria-expanded="false" aria-controls={w.id}>
                    <span className="way__tag"><i />{w.tag}</span>
                    <h3>{w.name}</h3>
                    <p className="way__sit">{w.sit}</p>
                    <div className="way__map" aria-hidden="true">
                      <div className="way__cols"><i>Target</i><i>Reach</i><i>Qualify</i><i>Book</i><i>Close</i></div>
                      {w.lanes.map(([who, left, width, label]) => (
                        <div className={`way__lane ${who}`} key={who}><span style={{ left: `${left}%`, width: `${width}%` }}>{label}</span></div>
                      ))}
                    </div>
                    <span className="way__more">How it works<b>+</b></span>
                  </button>
                  <div className="way__body" id={w.id}><div><p>{w.body}</p></div></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. PROOF */}
        <section className="proof" id="proof">
          <div className="wrap">
            <div className="sec-head">
              <p className="eyebrow">Case study</p>
              <h2>What we&apos;ve done for our clients.</h2>
              <p>Here is one engagement, start to finish: what was broken, what we built and what changed.</p>
            </div>
            <div className="case">
              <div className="case__l">
                <p className="proof__co"><b>ChargingAdda</b>EV charging infrastructure, Bengaluru. Live in 3 cities, 150+ connectors.</p>
                <div className="case__cols">
                  <div><h3>The situation</h3><p>Founder-led enterprise sales with no dedicated outbound function. Big ambitions across RWAs, commercial real estate and fleet operators, but no repeatable way to reach them.</p></div>
                  <div><h3>What we built</h3><p>A full outbound engine across cold calling, email and LinkedIn. Several ICPs tested in month one, then the winners, RWAs and commercial real estate, scaled from month two, with weekly founder syncs.</p></div>
                </div>
                <blockquote>“We went from founder-led outreach to a real pipeline function in two months.”<cite>Jibin Dev, Founder and CEO, ChargingAdda</cite></blockquote>
              </div>
              <dl className="case__r">
                <div><dt><span className="count" data-to="3" data-suf="×">3×</span></dt><dd>growth in sourced pipeline</dd></div>
                <div><dt><span className="count" data-to="57.5" data-dec="1" data-suf="%">57.5%</span></dt><dd>of revenue attributed to Salient versus the prior period</dd></div>
                <div><dt>~<span className="count" data-to="40" data-suf="%">40%</span></dt><dd>meeting to opportunity conversion</dd></div>
              </dl>
            </div>
            <div className="who">
              <p>Works for any B2B company with a sales-led motion</p>
              <ul><li>SaaS</li><li>IT services</li><li>Fintech and NBFCs</li><li>Logistics</li><li>Manufacturing</li><li>EV and infrastructure</li><li>Professional services</li></ul>
            </div>
          </div>
        </section>

        {/* 8. NO BLACK BOX: Salient's own tools, rotated by Effects */}
        <section className="rep" id="report">
          <div className="wrap">
            <div className="rep__head rv">
              <div><p className="what__pre">No black box.</p><h2>You see every number, every week.</h2></div>
              <p className="rep__body">Salient runs on its own ICP mapping, account-signal engine and pipeline dashboards. You see what we see: who we&apos;re targeting, why now, and what it turned into.</p>
            </div>
            <div className="rep__g">
              <div className="rep__tabs rv" role="tablist" aria-label="Salient tools">
                {TOOLS.map(([name, desc], k) => (
                  <button className={k ? 'rt' : 'rt on'} role="tab" aria-selected={k === 0} data-p={k} key={name}>
                    <span className="rt__n">0{k + 1}</span><b>{name}</b><span className="rt__d">{desc}</span><i className="rt__bar" />
                  </button>
                ))}
                <ul className="rep__chips"><li>Weekly report</li><li>Weekly sync</li><li>Written diagnosis at day 30</li></ul>
              </div>
              <div className="rep__stage rv">
                <div className="rp on" data-p="0">
                  <div className="engine" id="engine" aria-label="Example: a universe of target accounts narrowed to booked meetings">
                    <div className="win__bar"><i /><i /><i /><span>salient / pipeline</span><span className="live"><i />Running</span></div>
                    <div className="engine__stats">
                      <div><span>Meetings booked</span><b>31</b><em>↗ 24% vs last month</em></div>
                      <div><span>Qualified rate</span><b>36%</b><em>of conversations</em></div>
                      <div><span>Pipeline added</span><b>₹1.4 Cr</b><em>this month</em></div>
                    </div>
                    <div className="engine__head"><b>Your pipeline this month</b></div>
                    <ol className="engine__rows">
                      <li data-w="100"><span>Target accounts</span><b data-to="1240">1,240</b><i /></li>
                      <li data-w="62"><span>Contacted</span><b data-to="612">612</b><i /></li>
                      <li data-w="42"><span>Engaged</span><b data-to="342">342</b><i /></li>
                      <li data-w="24"><span>Qualified</span><b data-to="87">87</b><i /></li>
                      <li data-w="14" className="hl"><span>Meetings on your calendar</span><b data-to="31">31</b><i /></li>
                    </ol>
                    <p className="engine__foot"><Mark /><span>A large universe of buyers, narrowed to the conversations worth taking</span></p>
                    <p className="week__note">Illustrative example</p>
                  </div>
                  <div className="toast" id="toast" aria-hidden="true"><i /><div><b>Meeting booked</b><span>CFO, NBFC · Wed, 3:00</span></div></div>
                </div>
                <div className="rp" data-p="1" aria-hidden="true">
                  <div className="engine icpm">
                    <div className="win__bar"><i /><i /><i /><span>salient / icp map</span><span className="live"><i />Scoring</span></div>
                    <div className="icpm__top">
                      <div><span>Accounts in your ICP</span><b id="icpN" data-to="2140">2,140</b></div>
                      <div className="icpm__legend"><span>Fit</span><i /><span>Low → high</span></div>
                    </div>
                    <div className="icpm__grid" id="icpGrid" />
                    <div className="icpm__f"><span>Buyer roles</span><div className="icpm__chips" id="icpRoles"><em>VP Ops</em><em>CFO</em><em>Founder</em><em>Head of Sales</em></div></div>
                    <div className="icpm__f"><span>Cities</span><div className="icpm__chips"><em>Bengaluru</em><em>Mumbai</em><em>NCR</em></div></div>
                    <p className="week__note">Illustrative example</p>
                  </div>
                </div>
                <div className="rp" data-p="2" aria-hidden="true">
                  <div className="engine sig">
                    <div className="win__bar"><i /><i /><i /><span>salient / account signals</span><span className="live"><i />Tracking</span></div>
                    <div className="sig__head"><b>Accounts showing intent</b><span>Newest signals first</span></div>
                    <ol className="sig__list" id="sigList" />
                    <p className="week__note">Illustrative example</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. PILOT */}
        <section className="pricing dark" id="pilot">
          <div className="wrap">
            <div className="sec-head">
              <p className="eyebrow">Getting started</p>
              <h2>Start with a pilot. Scale on proof.</h2>
              <p>Priced per qualified meeting booked, with an optional success commission. You commit to more only once the numbers prove out.</p>
            </div>
            <ol className="phases">
              <li><span>Month 1</span><b>Discover</b><p>We learn your business, define your ICP and run live outbound across several hypotheses. You get a written diagnosis of what converts and where your funnel leaks.</p></li>
              <li><span>Month 2</span><b>Scale what works</b><p>Winning segments scaled, weak ones cut, with weekly optimisation. A target agreed on month one data, not a guess.</p></li>
              <li><span>Month 3+</span><b>Compound</b><p>More qualified pipeline every month, with new channels and segments as the numbers prove out.</p></li>
            </ol>
            <div className="d30">
              <h3>Your first 30 days</h3>
              <ol className="d30__list">
                <li><span>Week 1</span><b>Scope and target</b><p>Scoping call, ICP agreed, target list built and prioritised.</p></li>
                <li><span>Week 2</span><b>Outreach goes live</b><p>Calls, email and LinkedIn start running as one sequence.</p></li>
                <li><span>Week 3</span><b>First conversations</b><p>Buyers respond, we qualify them, and meetings start landing.</p></li>
                <li><span>Week 4</span><b>Written diagnosis</b><p>What converts, the volume to expect at scale, and where your funnel leaks.</p></li>
              </ol>
            </div>
            <a className="btn" href="#contact">Scope your pilot</a>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="faq">
          <div className="wrap faq__g">
            <p className="eyebrow">FAQ</p>
            <h2>Questions, answered.</h2>
            <div>
              {FAQ.map(([q, a]) => (
                <details key={q}><summary>{q}</summary><p>{a}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* 11. CONTACT */}
        <section className="contact" id="contact">
          <div className="wrap">
            <div className="cta">
              <Mark className="cta__mark" />
              <div className="cta__copy">
                <h2>Let&apos;s build your pipeline.</h2>
                <p>Book a 30-minute scoping call. You&apos;ll leave with a clear view of who to target and what a pilot would look like for you.</p>
                <ul className="cta__get">
                  <li><b>Your ICP, mapped</b><span>The companies and buyer roles we&apos;d go after first</span></li>
                  <li><b>A sample target list</b><span>Real accounts from your market, not a template</span></li>
                  <li><b>A pilot plan in 24 hours</b><span>Scope, channels and the meeting target we&apos;d commit to</span></li>
                </ul>
                <p className="cta__mail">Prefer email? <a href="mailto:sales@salientco.in">sales@salientco.in</a></p>
              </div>
              <BookingForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="foot dark">
        <div className="wrap">
          <div className="foot__top">
            <div className="foot__brand">
              <img src="/assets/salient-logo-white.png" alt="Salient" width={640} height={404} loading="lazy" />
              <p>Managed B2B outbound. We build your pipeline. You close the deals.</p>
              <a className="btn btn--sm" href="#contact">Book a scoping call</a>
            </div>
            <nav className="foot__col" aria-label="Footer">
              <h4>Explore</h4>
              <a href="#how">How we build</a><a href="#function">Why Salient</a><a href="#plug-in">Ways to work with us</a><a href="#proof">Results</a><a href="#pilot">Pilot</a>
            </nav>
            <div className="foot__col">
              <h4>Contact</h4>
              <a href="mailto:sales@salientco.in">sales@salientco.in</a><a href="tel:+919980789559">+91 99807 89559</a><a href="#contact">Book a 30-minute call</a>
            </div>
            <div className="foot__col">
              <h4>Office</h4>
              <address>Salient Private Limited<br />2nd Floor, No. 129, 5th Main Rd<br />Above Bank of Baroda, 3rd Phase<br />J. P. Nagar, Bengaluru<br />Karnataka 560078</address>
            </div>
          </div>
          <div className="foot__bot"><small>© <span id="year">2026</span> Salient Private Limited. All rights reserved.</small><small>Made in Bengaluru</small></div>
        </div>
      </footer>

      <div className="mcta" id="mcta" role="region" aria-label="Book a call">
        <span>Free 30-minute scoping call</span><a className="btn btn--sm" href="#contact">Book a call</a>
      </div>

      <Effects />
    </>
  );
}
