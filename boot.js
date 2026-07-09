// boot.js — Scale Trainer
// Loads LAST. Runs the integrity self-check, loads saved data, wires the single
// event handlers, and renders the first screen. Mirrors the PAT boot guard: if a
// build is half-loaded (e.g. a duplicate-const SyntaxError killed a file), the
// guard refuses to touch storage so we never write against a broken build.
// (c) 2026 Peter Birchley. All rights reserved.

// The critical cross-file functions that MUST exist before we load()/save().
// If any is missing, a script file failed to parse — bail out visibly rather
// than corrupt saved data.
function bootIntegrityOk() {
  var required = [
    "buildPool", "expandRow", "itemInstruction",   // syllabus
    "sanitizeSettings", "sanitizeRatings", "sanitizeSessions", // storage validators
    "schedule", "buildDueSet", "dueCount", "isDue", // scheduler
    "startSession", "rateCurrent", "commitWorkoutLog", // session
    "render",                                        // render
  ];
  for (var i = 0; i < required.length; i++) {
    if (typeof globalThis[required[i]] !== "function") return false;
  }
  // also confirm the core constants loaded
  if (typeof K_SETTINGS !== "string" || typeof RATINGS === "undefined") return false;
  return true;
}

function showBootError() {
  var app = document.getElementById("app");
  if (app) {
    app.innerHTML =
      '<section class="card"><h2>Couldn\u2019t start</h2>'
      + '<p>The app didn\u2019t load fully. Fully close it from the app switcher and reopen. '
      + 'If it keeps happening, reinstall from the same link.</p></section>';
  }
}

function boot() {
  if (!bootIntegrityOk()) { showBootError(); return; }

  load();  // reads + validates saved settings/ratings (guarded internally too)

  // hidden file input for import
  _fileInput = document.createElement("input");
  _fileInput.type = "file";
  _fileInput.accept = "application/json,.json";
  _fileInput.style.display = "none";
  _fileInput.addEventListener("change", function () {
    if (_fileInput.files && _fileInput.files[0]) {
      handleImportFile(_fileInput.files[0]);
      _fileInput.value = ""; // allow re-importing the same filename
    }
  });
  document.body.appendChild(_fileInput);

  // single delegated handlers
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);

  state.view = "home";
  render();

  // register the service worker (offline). Non-fatal if it fails.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
}

// run on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
