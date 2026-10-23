/**
 * Salient: scoping-call booking for salientco.in
 *
 * Paste this into a Google Apps Script project owned by the Google account whose
 * calendar should receive the bookings (see README, "Google Meet booking").
 *
 *   GET  -> the offered slots and whether each is still free
 *   POST -> books one slot: creates a calendar event with a Google Meet link and
 *           emails the invite to the visitor (and to you, as the organiser)
 *
 * Needs the advanced "Google Calendar API" service (Services > + > Google Calendar API).
 * Deploy as a Web app: Execute as "Me", Who has access "Anyone".
 */
var CONFIG = {
  calendarId: 'primary',        // the calendar bookings go into
  timeZone: 'Asia/Kolkata',     // slot times are in IST
  times: ['11:00', '16:00'],    // start times offered each working day; keep in sync with script.js
  workingDays: 3,               // how many working days ahead, starting tomorrow
  minutes: 30,                  // call length
  title: 'Salient scoping call',
  alsoInvite: ''                // optional extra guest, e.g. a colleague's email
};

function doGet() {
  return json({ ok: true, slots: slotList() });
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p._gotcha) return json({ ok: true });                       // spam honeypot
  var name = clean(p.name, 80), email = clean(p.email, 120),
      company = clean(p.company, 120), stage = clean(p.stage, 80), slot = clean(p.slot, 40);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please add your name and a valid work email.' });
  }

  var lock = LockService.getScriptLock();                           // no double bookings
  lock.waitLock(20000);
  try {
    var slots = slotList();
    var chosen = slots.filter(function (s) { return s.start === slot; })[0];
    if (!chosen || !chosen.free) {
      return json({ ok: false, error: 'That time was just taken. Please pick another.', slots: slots });
    }
    var start = new Date(slot), end = new Date(start.getTime() + CONFIG.minutes * 60000);
    var attendees = [{ email: email, displayName: name }];
    if (CONFIG.alsoInvite) attendees.push({ email: CONFIG.alsoInvite });

    var ev = Calendar.Events.insert({
      summary: CONFIG.title + ': ' + (company || name),
      description: 'Booked on salientco.in\n\nName: ' + name + '\nEmail: ' + email +
                   '\nCompany: ' + company + '\nPipeline today: ' + stage,
      start: { dateTime: start.toISOString(), timeZone: CONFIG.timeZone },
      end: { dateTime: end.toISOString(), timeZone: CONFIG.timeZone },
      attendees: attendees,
      conferenceData: { createRequest: { requestId: Utilities.getUuid(),
                                         conferenceSolutionKey: { type: 'hangoutsMeet' } } }
    }, CONFIG.calendarId, { conferenceDataVersion: 1, sendUpdates: 'all' });

    return json({ ok: true, start: slot, meet: ev.hangoutLink || '' });
  } finally {
    lock.releaseLock();
  }
}

/* The next N working days (Mon-Fri, IST) x CONFIG.times, each marked free or busy. */
function slotList() {
  var tz = CONFIG.timeZone, out = [];
  var day = new Date(Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd') + 'T12:00:00+05:30');
  var found = 0;
  while (found < CONFIG.workingDays) {
    day = new Date(day.getTime() + 86400000);
    var dow = +Utilities.formatDate(day, tz, 'u');                  // 1 = Mon ... 7 = Sun
    if (dow > 5) continue;
    found++;
    var ymd = Utilities.formatDate(day, tz, 'yyyy-MM-dd');
    CONFIG.times.forEach(function (t) { out.push({ start: ymd + 'T' + t + ':00+05:30', free: true }); });
  }

  var calId = CONFIG.calendarId === 'primary' ? Session.getEffectiveUser().getEmail() : CONFIG.calendarId;
  var cals = Calendar.Freebusy.query({
    timeMin: new Date(out[0].start).toISOString(),
    timeMax: new Date(new Date(out[out.length - 1].start).getTime() + CONFIG.minutes * 60000).toISOString(),
    timeZone: tz,
    items: [{ id: calId }]
  }).calendars || {};
  var busy = (cals[calId] || cals[Object.keys(cals)[0]] || {}).busy || [];

  out.forEach(function (s) {
    var a = new Date(s.start).getTime(), b = a + CONFIG.minutes * 60000;
    s.free = !busy.some(function (x) { return new Date(x.start).getTime() < b && new Date(x.end).getTime() > a; });
  });
  return out;
}

function clean(v, n) { return String(v || '').trim().slice(0, n); }

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
