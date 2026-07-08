// session.js — Scale Trainer
// Builds a practice session's queue and applies ratings. Build 1 has no
// adaptive scheduler yet (that's Build 2) — ordering here is simple: syllabus
// order for "all"/"manual", shuffled for "surprise". The rating plumbing is
// wired now so Build 2 can hang the scheduler off the recorded history.
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

// Start a session.
//   mode: "all"      -> whole pool in syllabus order
//         "surprise" -> whole pool shuffled
//         "manual"   -> caller supplies an explicit array of items
//         "due"      -> only items due today (spaced repetition), weakest-first
function startSession(mode, manualItems) {
  var pool;
  if (mode === "manual" && Array.isArray(manualItems)) {
    pool = manualItems;
  } else if (mode === "due") {
    pool = buildDueSet(currentSelection());   // already ordered weakest-first
  } else {
    pool = buildPool(currentSelection());
    if (mode === "surprise") pool = shuffled(pool);
  }
  pool = applyCap(pool);

  state.session = { queue: pool, index: 0, mode: mode };
  state.view = "session";
  return state.session;
}

function endSession() {
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

  return advance();
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
