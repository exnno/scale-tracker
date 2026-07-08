// render.js — Scale Trainer
// All DOM drawing. Reads state, writes the #app innerHTML for the current view.
// No storage writes here; no event handling logic (that's dispatch.js) beyond
// wiring data-action attributes that dispatch reads. (c) 2026 Peter Birchley.

// ---- small html helpers -------------------------------------------------

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function el(id) { return document.getElementById(id); }

// ---- top-level render dispatch ------------------------------------------

function render() {
  var app = el("app");
  if (!app) return;
  if (state.view === "session") { app.innerHTML = renderSession(); }
  else if (state.view === "about") { app.innerHTML = renderAbout(); }
  else { app.innerHTML = renderHome(); }
}

// ---- home screen --------------------------------------------------------

function renderHome() {
  var sel = currentSelection();
  var count = poolSize(sel);
  var s = state.settings;

  var gradeBtns = [1, 2, 3].map(function (g) {
    var on = s.grade === g ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="set-grade" data-grade="' + g + '">Grade ' + g + '</button>';
  }).join("");

  // scope: Build 1 exposes grade + cumulative (complete-keys comes with Build 2)
  var scopeBtns = ["grade", "cumulative"].map(function (sc) {
    var on = s.scope === sc ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="set-scope" data-scope="' + sc + '">' + esc(SCOPES[sc]) + "</button>";
  }).join("");

  var formBtns = ["natural", "harmonic", "melodic"].map(function (f) {
    var on = s.minorForms.indexOf(f) !== -1 ? " is-on" : "";
    var label = f.charAt(0).toUpperCase() + f.slice(1);
    return '<button class="chip' + on + '" data-action="toggle-form" data-form="' + f + '">' + label + "</button>";
  }).join("");

  var natNote = (s.grade === 3)
    ? '<p class="hint">Grade 3 doesn\u2019t include natural minor, so it\u2019s left out of this grade\u2019s scales automatically.</p>'
    : "";

  var capVal = s.sessionCap > 0 ? s.sessionCap : "";

  return ''
    + '<header class="bar"><h1>Scale Trainer</h1>'
    + '<button class="link" data-action="go-about">About</button></header>'

    + '<section class="card">'
    + '<h2>Grade</h2><div class="chips">' + gradeBtns + '</div>'
    + '</section>'

    + '<section class="card">'
    + '<h2>What to include</h2><div class="chips">' + scopeBtns + '</div>'
    + '</section>'

    + '<section class="card">'
    + '<h2>Minor scale forms</h2><div class="chips">' + formBtns + '</div>'
    + natNote
    + '</section>'

    + '<section class="card">'
    + '<h2>Session limit</h2>'
    + '<label class="capline">Stop after '
    + '<input class="capinput" type="number" min="0" inputmode="numeric" '
    + 'data-action="set-cap" value="' + capVal + '" placeholder="all"> scales '
    + '<span class="hint">(leave blank for the whole set)</span></label>'
    + '</section>'

    + '<section class="card poolcard">'
    + '<p class="poolcount"><strong>' + count + '</strong> scale' + (count === 1 ? "" : "s") + ' in today\u2019s set</p>'
    + '<div class="startrow">'
    + '<button class="primary" data-action="start-all">Start practice</button>'
    + '<button class="secondary" data-action="start-surprise">Surprise me</button>'
    + '</div>'
    + (count === 0 ? '<p class="hint">Pick at least one minor form (or a grade with major scales) to build a set.</p>' : "")
    + '</section>';
}

// ---- session screen -----------------------------------------------------

function renderSession() {
  var item = currentItem();
  var prog = sessionProgress();

  // finished?
  if (!item) {
    return ''
      + '<header class="bar"><h1>Done</h1></header>'
      + '<section class="card done">'
      + '<p class="bigtick">\u2713</p>'
      + '<h2>Session complete</h2>'
      + '<p>You worked through ' + prog.total + ' scale' + (prog.total === 1 ? "" : "s") + '.</p>'
      + '<button class="primary" data-action="end-session">Back to start</button>'
      + '</section>';
  }

  var prev = ratingFor(item.id).last;
  var prevNote = prev
    ? '<p class="prev">Last time: ' + esc(RATING_LABEL[prev]) + '</p>'
    : '<p class="prev">First time practising this one</p>';

  var pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;

  var rateBtns = RATINGS.map(function (r) {
    return '<button class="rate rate-' + r + '" data-action="rate" data-rating="' + r + '">'
      + esc(RATING_LABEL[r]) + '</button>';
  }).join("");

  return ''
    + '<header class="bar">'
    + '<button class="link" data-action="quit-session">Quit</button>'
    + '<span class="count">' + (prog.done + 1) + ' / ' + prog.total + '</span>'
    + '</header>'
    + '<div class="progress"><div class="progressfill" style="width:' + pct + '%"></div></div>'

    + '<section class="card scalecard">'
    + '<p class="instruction">' + esc(item.instruction) + '</p>'
    + prevNote
    + '</section>'

    + '<section class="card ratecard">'
    + '<p class="ratelead">How did that go?</p>'
    + '<div class="rates">' + rateBtns + '</div>'
    + '</section>';
}

// ---- about screen -------------------------------------------------------

function renderAbout() {
  return ''
    + '<header class="bar">'
    + '<button class="link" data-action="go-home">\u2039 Back</button>'
    + '<h1>About</h1></header>'

    + '<section class="card">'
    + '<h2>Scale Trainer</h2>'
    + '<p>Version ' + esc(APP_VERSION) + '</p>'
    + '<p>A practice guide for piano scales following the ABRSM syllabus. '
    + 'It tells you what to play and you play it on your own piano \u2014 there\u2019s no microphone or listening.</p>'
    + '</section>'

    + '<section class="card">'
    + '<h2>What\u2019s here</h2>'
    + '<p>Grades 1\u20133 similar-motion scales. Pick a grade, choose whether to include earlier grades, '
    + 'set which minor forms you practise, then work through them rating each one. Your ratings are saved on this device.</p>'
    + '</section>'

    + '<section class="card">'
    + '<h2>Your data</h2>'
    + '<p>Everything is stored on this device only. Use these to move it or keep a copy.</p>'
    + '<div class="startrow">'
    + '<button class="secondary" data-action="export">Export save file</button>'
    + '<button class="secondary" data-action="import">Import save file</button>'
    + '</div>'
    + '<p class="hint" id="iomsg"></p>'
    + '</section>'

    + '<section class="card">'
    + '<p class="copyright">\u00a9 2026 Peter Birchley. All rights reserved.</p>'
    + '</section>';
}
