// config.js — Scale Trainer
// App-wide constants: version, storage keys, rating vocabulary, defaults.
// Loads first (nothing depends on anything). No DOM, no storage calls here.
// (c) 2026 Peter Birchley. All rights reserved.

const APP_VERSION = "3.0.0";          // human app version (About page)
const BACKUP_VERSION = 2;             // save-file schema version (bump on schema change)
                                      // v2 adds per-item nextDue/interval (Build 2 scheduler).
                                      // v3's practiceDaysPerWeek is additive+optional -> no bump.

// localStorage keys (namespaced "st:" = Scale Trainer)
const K_SETTINGS = "st:settings";     // user selection: grade, scope, minorForms, etc.
const K_RATINGS  = "st:ratings";      // { itemId: { last: "nailed", history: [...] } }

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
  { v: "3.0.0", note: "Practice plan: choose how many days a week you play and each session serves a manageable portion of what's due. New Upcoming and History views, and a reset-data control." },
  { v: "2.0.0", note: "Review schedule added: scales you struggle with come back sooner, ones you nail stretch further out. \u201cToday's practice\u201d builds from what's due." },
  { v: "1.0.0", note: "First release: Grades 1\u20133 similar-motion scales, three-way rating, and save/load." },
];
