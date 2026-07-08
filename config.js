// config.js — Scale Trainer
// App-wide constants: version, storage keys, rating vocabulary, defaults.
// Loads first (nothing depends on anything). No DOM, no storage calls here.
// (c) 2026 Peter Birchley. All rights reserved.

const APP_VERSION = "1.0.0";          // human app version (About page)
const BACKUP_VERSION = 1;             // save-file schema version (bump on schema change)

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

// Practice-scope modes (decision 17). "complete" is defined but Build 1 only
// exposes grade + cumulative; complete-keys advanced mode arrives with the
// scheduler work. Kept here so the vocabulary is fixed from the start.
const SCOPES = {
  grade: "This grade only",
  cumulative: "This grade + all previous",
  complete: "Complete keys (advanced)",
};

// Sensible defaults for a first run.
const DEFAULT_SETTINGS = {
  grade: 1,
  scope: "grade",
  minorForms: ["harmonic"],   // user can add natural/melodic where the grade allows
  sessionCap: 0,              // 0 = no cap (walk the whole pool)
};
