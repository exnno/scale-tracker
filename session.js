// session.js — Scale Trainer
// Builds a practice session's queue and applies ratings. Build 2 added the
// scheduler ("due" mode). Build 3 adds the PACING PLAN: a "due" session is
// sized to a portion of the backlog (ceil(due / practiceDaysPerWeek)) unless a
// manual session cap overrides it. The scheduler itself is untouched.
// (c) 2026 Peter Birchley. All rights reserved.

// Fisher-Yates shuffle (returns a new array).
function shuffled(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// Apply the optional per-session cap (0 = no cap).
function applyCap(items) {
  var cap = state.settings.sessionCap;
  if (cap && cap > 0 && items.length > cap) return items.slice(0, cap);
  return items;
}

// Build 3 — the planned portion for a "due" sitting.
//   - If a manual session cap is set (>0), that wins (the override).
//   - Otherwise the plan portion = ceil(dueCount / practiceDaysPerWeek),
//     floored at 1 so a non-empty due set never serves zero.
// Returns a positive integer (the number of due items to serve).
function plannedPortion(selection) {
  var due = dueCount(selection);
  if (due === 0) return 0;

  var cap = state.settings.sessionCap;
  if (cap && cap > 0) return Math.min(cap, due);

  var dpw = state.settings.practiceDaysPerWeek || DEFAULT_SETTINGS.practiceDaysPerWeek;
  var portion = Math.ceil(due / dpw);
  if (portion < 1) portion = 1;
  return Math.min(portion, due);
}

// Start a session.
//   mode: "all"      -> whole pool in syllabus order
//         "surprise" -> whole pool shuffled
//         "manual"   -> caller supplies an explicit array of items
//         "due"      -> due items (spaced repetition), weakest-first, sized to
//                       the planned portion (Build 3)
function startSession(mode, manualItems) {
  var pool;
  if (mode === "manual" && Array.isArray(manualItems)) {
    pool = manualItems;
  } else if (mode === "due") {
    pool = buildDueSet(currentSelection());   // already ordered weakest-first
    // size to the plan portion (manual cap already folded into plannedPortion)
    var n = plannedPortion(currentSelection());
    if (n > 0 && pool.length > n) pool = pool.slice(0, n);
    state.session = { queue: pool, index: 0, mode: mode, results: [], logged: false };
    state.view = "session";
    return state.session;
  } else {
    pool = buildPool(currentSelection());
    if (mode === "surprise") pool = shuffled(pool);
  }
  pool = applyCap(pool);

  state.session = { queue: pool, index: 0, mode: mode, results: [], logged: false };
  state.view = "session";
  return state.session;
}

// Build 4: commit the current sitting to the workout log, once, if it has any
// ratings. Called both when a session finishes and when it's quit part-way, so
// partial sittings are never lost. The `logged` flag guards against a
// double-commit (e.g. finish then "Back to start" both routing through here).
function commitWorkoutLog() {
  var s = state.session;
  if (!s || s.logged) return;
  if (!s.results || s.results.length === 0) { s.logged = true; return; }
  state.sessions.push({
    t: Date.now(),
    mode: s.mode,
    results: s.results.slice(),
  });
  if (state.sessions.length > MAX_SESSIONS_LOGGED) {
    state.sessions = state.sessions.slice(state.sessions.length - MAX_SESSIONS_LOGGED);
  }
  s.logged = true;
  saveSessions();
}

function endSession() {
  commitWorkoutLog();   // log whatever was rated (quit or finished)
  state.session = null;
  state.view = "home";
}

// Record a rating for the current item, persist it, and advance.
// Returns true if the session continues, false if it just finished.
function rateCurrent(rating) {
  if (!validRating(rating)) return inSession();
  var item = currentItem();
  if (!item) return false;

  var rec = state.ratings[item.id] || { last: null, history: [] };
  rec.last = rating;
  rec.history.push({ r: rating, t: Date.now() });
  // keep history from growing without bound; last 50 is plenty
  if (rec.history.length > 50) rec.history = rec.history.slice(-50);
  schedule(rec);                 // sets rec.interval + rec.nextDue (Build 2)
  state.ratings[item.id] = rec;
  saveRatings();

  // Build 4: record THIS sitting's result for the workout log.
  if (state.session) state.session.results.push({ id: item.id, rating: rating });

  var more = advance();
  // If that was the final item, commit the log now so a sitting is recorded
  // even if the user closes the app on the done screen without tapping "Back".
  if (!more) commitWorkoutLog();
  return more;
}

// Move to the next item. Returns true if there's another item, false if done.
function advance() {
  if (!state.session) return false;
  state.session.index += 1;
  if (state.session.index >= state.session.queue.length) {
    return false; // finished — caller shows the summary
  }
  return true;
}

// Progress helper for the UI: { done, total }.
function sessionProgress() {
  if (!state.session) return { done: 0, total: 0 };
  return { done: state.session.index, total: state.session.queue.length };
}
