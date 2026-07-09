// state.js — Scale Trainer
// The single in-memory state object. No persistence logic here (that's storage.js);
// no rendering here (that's render.js). Just the shape + tiny pure helpers.
// (c) 2026 Peter Birchley. All rights reserved.

const state = {
  // user settings (mirrors DEFAULT_SETTINGS shape, loaded from storage on boot)
  settings: {
    grade: 1,
    scope: "grade",
    minorForms: ["harmonic"],
    sessionCap: 0,
    practiceDaysPerWeek: 4,
  },

  // ratings map: { itemId: { last: "struggled"|"okay"|"nailed", history: [ {r, t} ] } }
  ratings: {},

  // Build 4: workout log — array of past sittings, newest last:
  //   { t: timestamp, mode: "due"|"all"|"surprise", results: [ {id, rating} ] }
  sessions: [],

  // the active session (null when not practising). Build 4 adds `results`,
  // the per-scale ratings for THIS sitting (accumulated as you rate), so the
  // log captures what happened this session — not each item's all-time last.
  //   { queue: [items], index: int, mode: "...", results: [ {id, rating} ] }
  session: null,

  // which screen: "home" | "session" | "about" | "upcoming" | "history" | "workouts"
  view: "home",

  // transient UI state that doesn't persist:
  //   resetArmed     — the two-step reset confirm on About is showing
  //   openHistory    — set of item ids whose history trail is expanded
  //   historyMode    — "all" | "bykey"  (History screen top toggle)
  //   historyKey     — selected root in By-key mode (null = none picked yet)
  //   historyKeyScope— "all" | "current" (By-key secondary toggle)
  //   openWorkouts   — set of workout timestamps whose details are expanded
  ui: {
    resetArmed: false,
    openHistory: {},
    historyMode: "all",
    historyKey: null,
    historyKeyScope: "all",
    openWorkouts: {},
  },
};

// ---- pure helpers -------------------------------------------------------

// The current settings-driven pool selection object passed to buildPool().
function currentSelection() {
  return {
    grade: state.settings.grade,
    scope: state.settings.scope,
    minorForms: state.settings.minorForms.slice(),
  };
}

// Look up a rating record, or a blank one.
function ratingFor(id) {
  return state.ratings[id] || { last: null, history: [] };
}

// Is a session currently active?
function inSession() {
  return state.session !== null;
}

// The item the session is currently on (or null).
function currentItem() {
  if (!state.session) return null;
  return state.session.queue[state.session.index] || null;
}
