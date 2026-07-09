// scheduler.js — Scale Trainer
// Build 2's one new system: a spaced-repetition engine keyed off the rating
// history recorded in Build 1. It answers two questions for any item:
//   - when is it next due? (a timestamp stored on the rating record)
//   - is it due now? (due timestamp reached, or never practised)
// and builds the "Today's practice" set: everything due, ordered weakest-first.
//
// Build 3 adds read-only look-ahead helpers (nextDueFor, upcomingBuckets) for
// the Upcoming view. The INTERVAL MODEL IS UNCHANGED — pacing lives in session.js.
//
// No DOM, no storage writes of its own — session.js calls schedule() when a
// rating is applied and persists via saveRatings(). Pure + testable, same
// discipline as syllabus.js. (c) 2026 Peter Birchley. All rights reserved.

// ---- interval model -----------------------------------------------------

// One day in ms. Kept as a constant so tests / future tuning have one dial.
const DAY_MS = 24 * 60 * 60 * 1000;

// The nailed-it ladder (in days). Each consecutive "nailed" steps one rung
// further down the ladder; the last rung repeats once maxed out. A "struggled"
// resets to rung 0 of its own short interval; "okay" sits in the middle and
// does not advance the nail streak.
const NAIL_LADDER = [7, 14, 30, 60];  // days

const INTERVAL = {
  struggled: 1,   // come back tomorrow
  okay: 3,        // a few days
  // nailed handled by the ladder + streak below
};

// Given a rating record's history, count consecutive "nailed" at the tail.
// A trailing struggled/okay makes this 0.
function nailStreak(history) {
  var n = 0;
  for (var i = history.length - 1; i >= 0; i--) {
    if (history[i].r === "nailed") n++;
    else break;
  }
  return n;
}

// Compute the interval in DAYS for a freshly-applied rating, given the record's
// full history (which already includes the just-pushed entry).
function intervalDaysFor(rating, history) {
  if (rating === "nailed") {
    var streak = nailStreak(history);            // >= 1 (this rating is nailed)
    var idx = Math.min(streak - 1, NAIL_LADDER.length - 1);
    return NAIL_LADDER[idx];
  }
  return INTERVAL[rating] || 1;
}

// ---- applying a rating --------------------------------------------------

// Called by rateCurrent() AFTER the new history entry is pushed. Mutates the
// record in place: sets interval (days) and nextDue (timestamp). Returns it.
function schedule(rec, now) {
  now = now || Date.now();
  var last = rec.last;
  var days = intervalDaysFor(last, rec.history);
  rec.interval = days;
  rec.nextDue = now + days * DAY_MS;
  return rec;
}

// ---- due logic ----------------------------------------------------------

// Is this item due right now? Never-practised (no record / no nextDue) counts
// as due. A record with a nextDue in the past is due.
function isDue(id, now) {
  now = now || Date.now();
  var rec = state.ratings[id];
  if (!rec || typeof rec.nextDue !== "number") return true;  // never scheduled
  return rec.nextDue <= now;
}

// Sort weight for ordering the due set. Lower = surfaced earlier.
//   struggled (0) -> never-practised (1) -> okay (2) -> nailed (3)
// Ties broken by how overdue (more overdue first).
function dueWeight(id, now) {
  now = now || Date.now();
  var rec = state.ratings[id];
  var band;
  if (!rec || rec.last === null) band = 1;            // never practised
  else if (rec.last === "struggled") band = 0;
  else if (rec.last === "okay") band = 2;
  else band = 3;                                       // nailed
  return band;
}

function overdueBy(id, now) {
  now = now || Date.now();
  var rec = state.ratings[id];
  if (!rec || typeof rec.nextDue !== "number") return Infinity; // never = most overdue
  return now - rec.nextDue;
}

// ---- building the due set ----------------------------------------------

// Build "Today's practice" from the current selection's full pool: keep only
// due items, ordered weakest-first then most-overdue-first. Returns items.
function buildDueSet(selection, now) {
  now = now || Date.now();
  var pool = buildPool(selection);
  var due = pool.filter(function (it) { return isDue(it.id, now); });

  due.sort(function (a, b) {
    var wa = dueWeight(a.id, now), wb = dueWeight(b.id, now);
    if (wa !== wb) return wa - wb;
    // same band: more overdue first
    var oa = overdueBy(a.id, now), ob = overdueBy(b.id, now);
    return ob - oa;
  });
  return due;
}

// Count of due items in a selection (for the home-screen line).
function dueCount(selection, now) {
  return buildDueSet(selection, now).length;
}

// ---- Build 3: read-only look-ahead (Upcoming view) ---------------------

// The next-due timestamp for an item, or null if never scheduled (due now).
function nextDueFor(id) {
  var rec = state.ratings[id];
  if (!rec || typeof rec.nextDue !== "number") return null;
  return rec.nextDue;
}

// Group the current selection's items into relative due buckets for the
// Upcoming view (decision 3A). Never-scheduled items land in "today".
// Returns { today:[items], tomorrow:[], week:[], later:[] } with each list in
// soonest-first order (never-scheduled treated as soonest within "today").
function upcomingBuckets(selection, now) {
  now = now || Date.now();
  var pool = buildPool(selection);

  // Day boundaries from local midnight so "tomorrow" means the calendar day.
  var start = new Date(now);
  start.setHours(0, 0, 0, 0);
  var startMs = start.getTime();
  var endToday = startMs + DAY_MS;        // < this = today
  var endTomorrow = startMs + 2 * DAY_MS; // < this = tomorrow
  var endWeek = startMs + 7 * DAY_MS;     // < this = within the next 7 days

  var out = { today: [], tomorrow: [], week: [], later: [] };

  pool.forEach(function (it) {
    var due = nextDueFor(it.id);
    // never scheduled OR due at/before end of today -> today
    if (due === null || due < endToday) out.today.push(it);
    else if (due < endTomorrow) out.tomorrow.push(it);
    else if (due < endWeek) out.week.push(it);
    else out.later.push(it);
  });

  // sort each bucket soonest-first; nulls (never scheduled) sort first
  function bySoonest(a, b) {
    var da = nextDueFor(a.id), db = nextDueFor(b.id);
    if (da === null && db === null) return 0;
    if (da === null) return -1;
    if (db === null) return 1;
    return da - db;
  }
  out.today.sort(bySoonest);
  out.tomorrow.sort(bySoonest);
  out.week.sort(bySoonest);
  out.later.sort(bySoonest);

  return out;
}
