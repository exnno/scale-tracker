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
  },

  // ratings map: { itemId: { last: "struggled"|"okay"|"nailed", history: [ {r, t} ] } }
  ratings: {},

  // the active session (null when not practising)
  //   { queue: [items], index: int, mode: "manual"|"surprise"|"all" }
  session: null,

  // which screen is showing: "home" | "session" | "about"
  view: "home",
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
