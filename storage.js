// storage.js — Scale Trainer
// localStorage persistence + human-readable export/import save file.
// Data integrity is the top priority: every load validates and collapses
// garbage to a safe default; export stays human-readable; import is backward
// compatible and refuses to wipe good data on a bad file.
// (c) 2026 Peter Birchley. All rights reserved.

// ---- low-level guarded localStorage ------------------------------------

function lsGet(key) {
  try { return localStorage.getItem(key); }
  catch (e) { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) { return false; }
}

// ---- validation helpers -------------------------------------------------

function validGrade(g) { return g === 1 || g === 2 || g === 3; }
function validScope(s) { return s === "grade" || s === "cumulative" || s === "complete"; }
function validForm(f) { return f === "natural" || f === "harmonic" || f === "melodic"; }
function validRating(r) { return RATINGS.indexOf(r) !== -1; }

// Coerce an arbitrary parsed object into a safe settings object.
function sanitizeSettings(raw) {
  var out = Object.assign({}, DEFAULT_SETTINGS);
  if (raw && typeof raw === "object") {
    if (validGrade(raw.grade)) out.grade = raw.grade;
    if (validScope(raw.scope)) out.scope = raw.scope;
    if (Array.isArray(raw.minorForms)) {
      var forms = raw.minorForms.filter(validForm);
      out.minorForms = forms.length ? forms : DEFAULT_SETTINGS.minorForms.slice();
    }
    if (typeof raw.sessionCap === "number" && raw.sessionCap >= 0) {
      out.sessionCap = Math.floor(raw.sessionCap);
    }
  }
  return out;
}

// Coerce an arbitrary parsed object into a safe ratings map.
function sanitizeRatings(raw) {
  var out = {};
  if (raw && typeof raw === "object") {
    Object.keys(raw).forEach(function (id) {
      var rec = raw[id];
      if (!rec || typeof rec !== "object") return;
      var last = validRating(rec.last) ? rec.last : null;
      var history = Array.isArray(rec.history)
        ? rec.history.filter(function (h) {
            return h && validRating(h.r) && typeof h.t === "number";
          })
        : [];
      var clean = { last: last, history: history };
      // Build 2 scheduling fields. Optional + backward-compatible: a v1 file
      // (backupVersion 1) has neither, and that's fine — a record with no
      // nextDue simply reads as "due now" (see scheduler.isDue).
      if (typeof rec.nextDue === "number") clean.nextDue = rec.nextDue;
      if (typeof rec.interval === "number" && rec.interval > 0) clean.interval = rec.interval;
      out[id] = clean;
    });
  }
  return out;
}

// ---- load / save --------------------------------------------------------

function load() {
  // integrity guard: refuse to run against a half-loaded build
  if (!bootIntegrityOk()) return;

  var s = null, r = null;
  try { s = JSON.parse(lsGet(K_SETTINGS)); } catch (e) { s = null; }
  try { r = JSON.parse(lsGet(K_RATINGS)); } catch (e) { r = null; }

  state.settings = sanitizeSettings(s);
  state.ratings = sanitizeRatings(r);
}

function saveSettings() {
  if (!bootIntegrityOk()) return false;
  return lsSet(K_SETTINGS, JSON.stringify(state.settings));
}

function saveRatings() {
  if (!bootIntegrityOk()) return false;
  return lsSet(K_RATINGS, JSON.stringify(state.ratings));
}

// ---- export / import (human-readable save file) -------------------------

// Build the backup object. Long, readable keys — never shortened — so a person
// can open the file and understand it (same principle as the PAT app).
function buildBackup() {
  return {
    app: "Scale Trainer",
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    ratings: state.ratings,
  };
}

function exportText() {
  return JSON.stringify(buildBackup(), null, 2);
}

// Import from text. Returns { ok, message }. On success, state is updated and
// persisted. On any structural failure, existing data is left untouched.
function importText(text) {
  var parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return { ok: false, message: "That file isn't valid — couldn't read it." }; }

  if (!parsed || parsed.app !== "Scale Trainer") {
    return { ok: false, message: "That doesn't look like a Scale Trainer save file." };
  }
  // Forward/back compatible: we validate fields we understand and ignore the rest.
  var newSettings = sanitizeSettings(parsed.settings);
  var newRatings = sanitizeRatings(parsed.ratings);

  state.settings = newSettings;
  state.ratings = newRatings;
  saveSettings();
  saveRatings();
  return { ok: true, message: "Save file loaded." };
}
