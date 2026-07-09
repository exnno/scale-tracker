// dispatch.js — Scale Trainer
// One delegated click/change handler for the whole app. Reads data-action
// attributes set by render.js, calls into session/storage/state, then re-renders.
// Keeping all wiring in one place mirrors the PAT app's dispatch pattern.
// (c) 2026 Peter Birchley. All rights reserved.

// Export/import use a hidden file input + a download blob. Declared here,
// created in boot.
var _fileInput = null;

function ioMsg(text) {
  var m = document.getElementById("iomsg");
  if (m) m.textContent = text;
}

function doExport() {
  try {
    var blob = new Blob([exportText()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = "scale-trainer-save-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    ioMsg("Save file downloaded.");
  } catch (e) {
    ioMsg("Couldn\u2019t export on this device.");
  }
}

function doImport() {
  if (_fileInput) _fileInput.click();
}

function handleImportFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    var res = importText(String(reader.result));
    ioMsg(res.message);
    if (res.ok) render();
  };
  reader.onerror = function () { ioMsg("Couldn\u2019t read that file."); };
  reader.readAsText(file);
}

// Leaving the About view should disarm a pending reset so it can't fire later.
function clearTransientUi() {
  state.ui.resetArmed = false;
}

// ---- main click handler -------------------------------------------------

function onClick(e) {
  var t = e.target.closest("[data-action]");
  if (!t) return;
  var action = t.getAttribute("data-action");

  switch (action) {
    case "set-grade":
      state.settings.grade = parseInt(t.getAttribute("data-grade"), 10);
      // if the new grade forbids a selected form (G3 natural), buildPool already
      // filters it; no need to mutate the user's stored preference.
      saveSettings(); render(); break;

    case "set-scope":
      state.settings.scope = t.getAttribute("data-scope");
      saveSettings(); render(); break;

    case "toggle-form": {
      var f = t.getAttribute("data-form");
      var i = state.settings.minorForms.indexOf(f);
      if (i === -1) state.settings.minorForms.push(f);
      else state.settings.minorForms.splice(i, 1);
      saveSettings(); render(); break;
    }

    case "set-days":
      state.settings.practiceDaysPerWeek = parseInt(t.getAttribute("data-days"), 10);
      saveSettings(); render(); break;

    case "start-due":
      if (dueCount(currentSelection()) === 0) return;
      startSession("due"); render(); break;

    case "start-all":
      if (poolSize(currentSelection()) === 0) return;
      startSession("all"); render(); break;

    case "start-surprise":
      if (poolSize(currentSelection()) === 0) return;
      startSession("surprise"); render(); break;

    case "rate":
      rateCurrent(t.getAttribute("data-rating"));
      render(); break;

    case "quit-session":
    case "end-session":
      endSession(); render(); break;

    case "go-about":
      clearTransientUi(); state.view = "about"; render(); break;

    case "go-upcoming":
      clearTransientUi(); state.view = "upcoming"; render(); break;

    case "go-history":
      clearTransientUi(); state.view = "history"; render(); break;

    case "go-workouts":
      clearTransientUi(); state.view = "workouts"; render(); break;

    case "go-home":
      clearTransientUi(); state.view = "home"; render(); break;

    case "toggle-history-row": {
      var id = t.getAttribute("data-id");
      if (id) {
        if (state.ui.openHistory[id]) delete state.ui.openHistory[id];
        else state.ui.openHistory[id] = true;
        render();
      }
      break;
    }

    case "hist-mode":
      state.ui.historyMode = t.getAttribute("data-mode");
      render(); break;

    case "hist-key":
      state.ui.historyKey = t.getAttribute("data-key");
      render(); break;

    case "hist-key-scope":
      state.ui.historyKeyScope = t.getAttribute("data-scope");
      // a key chosen under one scope may not exist under the other; the view
      // guards for that, so no need to clear the selection here.
      render(); break;

    case "toggle-workout": {
      var wt = parseInt(t.getAttribute("data-t"), 10);
      if (!isNaN(wt)) {
        if (state.ui.openWorkouts[wt]) delete state.ui.openWorkouts[wt];
        else state.ui.openWorkouts[wt] = true;
        render();
      }
      break;
    }

    case "reset-arm":
      state.ui.resetArmed = true; render(); break;

    case "reset-cancel":
      state.ui.resetArmed = false; render(); break;

    case "reset-confirm":
      resetAllData();
      state.ui.resetArmed = false;
      state.ui.openHistory = {};
      state.view = "home";
      render();
      break;

    case "export":
      doExport(); break;

    case "import":
      doImport(); break;
  }
}

// ---- change handler (session cap number field) --------------------------

function onChange(e) {
  var t = e.target.closest("[data-action]");
  if (!t) return;
  if (t.getAttribute("data-action") === "set-cap") {
    var v = parseInt(t.value, 10);
    state.settings.sessionCap = (isNaN(v) || v < 0) ? 0 : v;
    saveSettings();
    // re-render so the pool count / plan portion line stays accurate
    render();
  }
}
