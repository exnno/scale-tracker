// config.js — Scale Trainer
// App-wide constants: version, storage keys, rating vocabulary, defaults.
// Loads first (nothing depends on anything). No DOM, no storage calls here.
// (c) 2026 Peter Birchley. All rights reserved.

const APP_VERSION = "4.0.0";          // human app version (About page)
const BACKUP_VERSION = 3;             // save-file schema version (bump on schema change)
                                      // v2 adds per-item nextDue/interval (Build 2 scheduler).
                                      // v3's practiceDaysPerWeek is additive+optional -> no bump.
                                      // v3->4 (BACKUP_VERSION 3): adds the st:sessions workout log.

// localStorage keys (namespaced "st:" = Scale Trainer)
const K_SETTINGS = "st:settings";     // user selection: grade, scope, minorForms, etc.
const K_RATINGS  = "st:ratings";      // { itemId: { last: "nailed", history: [...] } }
const K_SESSIONS = "st:sessions";     // Build 4: workout log — array of past sittings

// Workout log cap: keep the most recent N sittings (Build 4). Same "bounded
// history" discipline as the per-item rating history (capped at 50).
const MAX_SESSIONS_LOGGED = 200;

// The 3-way rating vocabulary (decision 15). Order = worst -> best.
const RATINGS = ["struggled", "okay", "nailed"];
const RATING_LABEL = {
  struggled: "Struggled",
  okay: "Okay",
  nailed: "Nailed it",
};

// Practice-scope modes (decision 17). "complete" is defined but not yet surfaced
// (needs all-12-keys data — parked for v4/v5). Kept here so the vocabulary is
// fixed from the start.
const SCOPES = {
  grade: "This grade only",
  cumulative: "This grade + all previous",
  complete: "Complete keys (advanced)",
};

// Practice-plan bounds (Build 3). practiceDaysPerWeek is an EFFORT DIAL, not a
// calendar: it sizes each sitting's portion of the due backlog. See scheduler /
// session plannedPortion().
const MIN_DPW = 1;
const MAX_DPW = 7;

// Sensible defaults for a first run.
const DEFAULT_SETTINGS = {
  grade: 1,
  scope: "grade",
  minorForms: ["harmonic"],   // user can add natural/melodic where the grade allows
  sessionCap: 0,              // 0 = no cap -> follow the plan portion
  practiceDaysPerWeek: 4,     // Build 3: spread the due backlog across ~this many sittings
};

// Rolling changelog for the About page (newest first, keep newest 3).
const CHANGELOG = [
  { v: "4.0.0", note: "Workout log: every practice session is now recorded so you can look back at what you did and how it went. History gains an \u201cAll / By key\u201d view so you can focus on a single key." },
  { v: "3.0.0", note: "Practice plan: choose how many days a week you play and each session serves a manageable portion of what's due. New Upcoming and History views, and a reset-data control." },
  { v: "2.0.0", note: "Review schedule added: scales you struggle with come back sooner, ones you nail stretch further out. \u201cToday's practice\u201d builds from what's due." },
];
