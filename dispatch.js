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
      state.view = "about"; render(); break;

    case "go-home":
      state.view = "home"; render(); break;

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
    // re-render so the pool count line stays accurate
    render();
  }
}
