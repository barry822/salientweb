'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

/* Booking: the next 3 working days at 11:00 and 16:00 IST. Slots come from the
   Google Calendar via the Apps Script (booking-setup/Code.gs); taken ones are
   greyed out, and booking one creates a Google Meet. Every request is also sent
   to Formspree, as a copy for the inbox. */
const FORMSPREE = 'https://formspree.io/f/xyekknel';
const BOOKING = 'https://script.google.com/macros/s/AKfycbxfyv2dMGFHyg8-P1evUGyKvCgx50gJlLVmZ-FEzkSDUGqMBN_Dg9qywJmw0D6kZ2mD/exec';
const SLOT_TIMES = ['11:00', '16:00'];   // keep in sync with Code.gs
const WORKING_DAYS = 3;
const IST = 'Asia/Kolkata';
const BTN = 'Book my scoping call';

type Slot = { start: string; free: boolean };
type Status = { kind: 'ok' | 'err'; body: ReactNode } | null;

const ist = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...o }).format(d);
function slotLabel(iso: string) {
  const d = new Date(iso);
  return {
    day: `${ist(d, { weekday: 'short' })} ${ist(d, { day: 'numeric' })}`,
    time: `${ist(d, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()} IST`,
    local: d.toLocaleString([], { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  };
}
function localSlots(): Slot[] {   // same rule as Code.gs, shown until (or unless) the calendar answers
  const [y, m, dd] = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date()).split('-').map(Number);
  let day = Date.UTC(y, m - 1, dd), found = 0;
  const out: Slot[] = [];
  while (found < WORKING_DAYS) {
    day += 86400000;
    const dow = new Date(day).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    found++;
    const iso = new Date(day).toISOString().slice(0, 10);
    SLOT_TIMES.forEach((t) => out.push({ start: `${iso}T${t}:00+05:30`, free: true }));
  }
  return out;
}
const Mail = () => <a href="mailto:sales@salientco.in">sales@salientco.in</a>;

export default function BookingForm() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [istHere, setIstHere] = useState(true);
  const firstFree = useRef<HTMLButtonElement | null>(null);

  // slots depend on today's date, so they're built in the browser, not at build time
  useEffect(() => {
    setSlots(localSlots());
    setIstHere(new Date().getTimezoneOffset() === -330);
    let alive = true;
    fetch(BOOKING).then((r) => r.json())
      .then((d) => { if (alive && d?.slots?.length) setSlots(d.slots); })
      .catch(() => {});   // keep the local slots; booking reports any clash
    return () => { alive = false; };
  }, []);

  // a chosen slot that turns out to be taken is unselected
  useEffect(() => {
    if (chosen && !slots.some((s) => s.start === chosen && s.free)) setChosen(null);
  }, [slots, chosen]);

  const label = useMemo(() => (chosen ? slotLabel(chosen) : null), [chosen]);
  const prefTime = label ? `${label.day}, ${label.time}` : '';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!chosen) {
      setStatus({ kind: 'err', body: firstFree.current
        ? 'Pick a time above to book your call.'
        : <>All times this week are taken. Email <Mail /> and we’ll find one.</> });
      firstFree.current?.focus();
      return;
    }
    const data = new FormData(form);
    const body = new URLSearchParams();
    ['name', 'email', 'company', 'stage', '_gotcha'].forEach((k) => body.append(k, String(data.get(k) ?? '')));
    body.append('slot', chosen);
    setBusy(true);
    setStatus(null);
    try {
      const d = await (await fetch(BOOKING, { method: 'POST', body })).json();
      if (!d.ok) {
        if (d.slots) setSlots(d.slots);
        setStatus({ kind: 'err', body: <>{d.error || 'That didn’t book.'} Or email <Mail />.</> });
        return;
      }
      // a copy for the inbox; the booking has already succeeded
      fetch(FORMSPREE, { method: 'POST', body: data, headers: { Accept: 'application/json' } }).catch(() => {});
      const email = String(data.get('email'));
      setSlots((list) => list.map((s) => (s.start === d.start ? { ...s, free: false } : s)));
      setChosen(null);
      form.reset();
      setStatus({ kind: 'ok', body: <>
        <b>Booked for {prefTime}.</b> A Google Meet invite is on its way to {email}.
        {d.meet && <> <a href={d.meet} target="_blank" rel="noopener">Meet link</a></>}
      </> });
    } catch {
      setStatus({ kind: 'err', body: <>That didn’t go through. Email <Mail /> directly.</> });
    } finally {
      setBusy(false);
    }
  }

  let firstFreeAssigned = false;
  return (
    <form id="contact-form" className="form cta__form" action={FORMSPREE} method="POST" onSubmit={submit}>
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999 }} />
      <div className="slots">
        <span className="slots__h">Pick a time that suits you <span className="slots__tz">(IST, 30 min, Google Meet)</span></span>
        <div className="slots__g" id="slots" role="radiogroup" aria-label="Preferred call time">
          {slots.map((s) => {
            const l = slotLabel(s.start);
            const ref = s.free && !firstFreeAssigned ? ((firstFreeAssigned = true), firstFree) : undefined;
            return (
              <button key={s.start} ref={ref} type="button" className="slot-b" role="radio"
                aria-checked={chosen === s.start} aria-disabled={s.free ? undefined : true}
                title={istHere ? undefined : `Your time: ${l.local}`}
                onClick={() => { if (s.free) { setChosen(s.start); setStatus(null); } }}>
                <b>{l.day}</b><span>{s.free ? l.time : 'Taken'}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="preferred_time" value={prefTime} />
      </div>
      <div className="form__row">
        <label>Name<input name="name" required autoComplete="name" /></label>
        <label>Work email<input type="email" name="email" required autoComplete="email" /></label>
      </div>
      <label>Company<input name="company" required autoComplete="organization" /></label>
      <label>Where is your pipeline today?
        <select name="stage"><option>No outbound yet</option><option>We have a sales team</option><option>Our funnel leaks</option></select>
      </label>
      <button className="btn btn--big" type="submit" id="bookBtn" disabled={busy}>
        {busy ? 'Booking…' : label ? `Book my call for ${prefTime}` : BTN}
      </button>
      <p className="form__fine">Free, 30 minutes, no commitment. We reply within one business day.</p>
      <p className={`form-status${status ? ' ' + status.kind : ''}`} id="form-status" role="status">{status?.body}</p>
    </form>
  );
}
