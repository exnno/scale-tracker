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

// Join a list of words into "a", "a and b", "a, b and c".
function humanList(words) {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  if (words.length === 2) return words[0] + " and " + words[1];
  return words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
}

function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// A friendly relative day label for a due timestamp (or null = never/now).
function dueLabel(ts) {
  if (ts === null) return "due now";
  var now = Date.now();
  if (ts <= now) return "due now";
  var start = new Date(); start.setHours(0, 0, 0, 0);
  var days = Math.round((ts - start.getTime()) / DAY_MS);
  if (days <= 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days < 7) return "due in " + days + " days";
  if (days < 14) return "due in about a week";
  if (days < 30) return "due in a few weeks";
  return "due in about a month";
}

// ---- top-level render dispatch ------------------------------------------

function render() {
  var app = el("app");
  if (!app) return;
  if (state.view === "session") { app.innerHTML = renderSession(); }
  else if (state.view === "about") { app.innerHTML = renderAbout(); }
  else if (state.view === "upcoming") { app.innerHTML = renderUpcoming(); }
  else if (state.view === "history") { app.innerHTML = renderHistory(); }
  else if (state.view === "workouts") { app.innerHTML = renderWorkouts(); }
  else { app.innerHTML = renderHome(); }
}

// ---- home screen --------------------------------------------------------

function renderHome() {
  var sel = currentSelection();
  var count = poolSize(sel);
  var due = dueCount(sel);
  var portion = plannedPortion(sel);
  var s = state.settings;

  var gradeBtns = [1, 2, 3].map(function (g) {
    var on = s.grade === g ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="set-grade" data-grade="' + g + '">Grade ' + g + '</button>';
  }).join("");

  // scope: grade + cumulative (complete-keys still parked)
  var scopeBtns = ["grade", "cumulative"].map(function (sc) {
    var on = s.scope === sc ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="set-scope" data-scope="' + sc + '">' + esc(SCOPES[sc]) + "</button>";
  }).join("");

  var formBtns = ["natural", "harmonic", "melodic"].map(function (f) {
    var on = s.minorForms.indexOf(f) !== -1 ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="toggle-form" data-form="' + f + '">' + cap1(f) + "</button>";
  }).join("");

  // Per-grade form note (Build 3). Reflects the SELECTION: cumulative pulls in
  // earlier grades whose syllabus may require natural minor even when the top
  // grade drops it.
  var grades = (s.scope === "cumulative")
    ? [1, 2, 3].filter(function (g) { return g <= s.grade; })
    : [s.grade];
  var reqSet = {};
  grades.forEach(function (g) {
    gradeRequiredForms(g).forEach(function (f) { reqSet[f] = true; });
  });
  var required = ["natural", "harmonic", "melodic"].filter(function (f) { return reqSet[f]; });
  var formNote = "";
  if (required.length) {
    var reqText = humanList(required.map(cap1));
    var scopeWord = (s.scope === "cumulative")
      ? "these grades"
      : "Grade " + s.grade;
    formNote = '<p class="hint">' + esc(scopeWord + " only needs " + reqText
      + " minor" + (required.length > 1 ? " forms" : "")
      + ". You can add the others if you wish.") + '</p>';
    // Grade 3 (top grade, non-cumulative) keeps the explicit natural-excluded note.
    if (s.scope !== "cumulative" && s.grade === 3) {
      formNote += '<p class="hint">Grade 3 doesn\u2019t include natural minor, so it\u2019s left out of this grade\u2019s scales automatically.</p>';
    }
  }

  var capVal = s.sessionCap > 0 ? s.sessionCap : "";

  // Practice-plan chooser (1..7)
  var dpwBtns = [];
  for (var d = MIN_DPW; d <= MAX_DPW; d++) {
    var on = s.practiceDaysPerWeek === d ? " is-on" : "";
    dpwBtns.push('<button class="chip' + on + '" data-action="set-days" data-days="' + d + '">' + d + '</button>');
  }

  // Due line wording: "N due · about M this session" (M honours a manual cap).
  var dueLine;
  if (due === 0) {
    dueLine = '<strong>0</strong> scales due today';
  } else {
    dueLine = '<strong>' + due + '</strong> due \u00b7 about <strong>' + portion + '</strong> this session';
  }

  return ''
    + '<header class="bar"><h1>Scale Trainer</h1>'
    + '<span class="headlinks">'
    + '<button class="link" data-action="go-upcoming">Upcoming</button>'
    + '<button class="link" data-action="go-history">History</button>'
    + '<button class="link" data-action="go-workouts">Workouts</button>'
    + '<button class="link" data-action="go-about">About</button>'
    + '</span></header>'

    + '<section class="card">'
    + '<h2>Grade</h2><div class="chips">' + gradeBtns + '</div>'
    + '</section>'

    + '<section class="card">'
    + '<h2>What to include</h2><div class="chips">' + scopeBtns + '</div>'
    + '</section>'

    + '<section class="card">'
    + '<h2>Minor scale forms</h2><div class="chips">' + formBtns + '</div>'
    + formNote
    + '</section>'

    + '<section class="card">'
    + '<h2>Practice plan</h2>'
    + '<p class="capline">I play <span class="dpwrow">' + dpwBtns.join("") + '</span> days a week</p>'
    + '<p class="hint">Each session serves about this share of what you\u2019re due, so you\u2019re never faced with the whole pile.</p>'
    + '</section>'

    + '<section class="card">'
    + '<h2>Session limit</h2>'
    + '<label class="capline">Stop after '
    + '<input class="capinput" type="number" min="0" inputmode="numeric" '
    + 'data-action="set-cap" value="' + capVal + '" placeholder="plan"> scales '
    + '<span class="hint">(leave blank to follow your plan)</span></label>'
    + '</section>'

    + '<section class="card poolcard">'
    + '<p class="poolcount">' + dueLine + '</p>'
    + '<button class="primary wide" data-action="start-due"' + (due === 0 ? " disabled" : "") + '>'
    + (due === 0 ? "Nothing due \u2014 all caught up" : "Today\u2019s practice") + '</button>'
    + '<p class="hint duehint">'
    + (due === 0
        ? "Come back later, or use the buttons below to practise anyway."
        : "The scales you\u2019re due to review, weakest first.")
    + '</p>'
    + '<div class="startrow manualrow">'
    + '<button class="secondary" data-action="start-all">Practise all ' + count + '</button>'
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

// ---- upcoming screen (Build 3) ------------------------------------------

function renderUpcoming() {
  var sel = currentSelection();
  var b = upcomingBuckets(sel);

  function bucket(title, items) {
    if (!items.length) return "";
    var rows = items.map(function (it) {
      return '<li class="uprow"><span class="upname">' + esc(it.instruction) + '</span></li>';
    }).join("");
    return '<section class="card">'
      + '<h2>' + esc(title) + ' <span class="badge">' + items.length + '</span></h2>'
      + '<ul class="uplist">' + rows + '</ul>'
      + '</section>';
  }

  var body = ''
    + bucket("Due today", b.today)
    + bucket("Tomorrow", b.tomorrow)
    + bucket("This week", b.week)
    + bucket("Later", b.later);

  if (!body) {
    body = '<section class="card"><p class="hint">No scales in the current set. '
      + 'Pick a grade and at least one minor form on the home screen.</p></section>';
  }

  return ''
    + '<header class="bar">'
    + '<button class="link" data-action="go-home">\u2039 Back</button>'
    + '<h1>Upcoming</h1></header>'
    + '<p class="hint subhead">What\u2019s coming up in the set you\u2019ve chosen. '
    + 'Scales you haven\u2019t practised yet count as due today.</p>'
    + body;
}

// ---- history screen (Build 3, reworked Build 4) -------------------------

// Every rateable item across the whole syllabus (all grades, all forms), used
// by the By-key "All grades" scope. Grade 3 + cumulative + all forms expands to
// the full G1-3 item set.
function allSyllabusItems() {
  return buildPool({ grade: 3, scope: "cumulative", minorForms: ["natural", "harmonic", "melodic"] });
}

// One history row (shared by both modes). `showGrade` adds a small grade tag,
// used in the By-key all-grades view so out-of-selection scales are clear.
function historyRow(it, showGrade) {
  var rec = ratingFor(it.id);
  var last = rec.last;
  var dot = last ? ('<span class="dot dot-' + last + '"></span>') : '<span class="dot dot-none"></span>';
  var lastText = last ? RATING_LABEL[last] : "Not practised yet";
  var due = nextDueFor(it.id);
  var open = state.ui.openHistory[it.id];
  var gradeTag = showGrade ? '<span class="gradetag">G' + it.grade + '</span> ' : '';

  var trail = "";
  if (open) {
    if (rec.history.length) {
      var entries = rec.history.slice().reverse().map(function (h) {
        var when = new Date(h.t);
        var dstr = when.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        return '<li><span class="dot dot-' + h.r + '"></span>'
          + esc(RATING_LABEL[h.r]) + ' \u00b7 <span class="hint">' + esc(dstr) + '</span></li>';
      }).join("");
      trail = '<ul class="trail">' + entries + '</ul>';
    } else {
      trail = '<p class="hint trail">No ratings recorded yet.</p>';
    }
  }

  return '<div class="histrow" data-action="toggle-history-row" data-id="' + esc(it.id) + '">'
    + '<div class="histhead">'
    + dot
    + '<span class="histname">' + gradeTag + esc(it.instruction) + '</span>'
    + '<span class="histmeta hint">' + esc(lastText) + ' \u00b7 ' + esc(dueLabel(due)) + '</span>'
    + '</div>'
    + trail
    + '</div>';
}

function renderHistory() {
  var mode = state.ui.historyMode || "all";

  var modeToggle = '<div class="segment">'
    + '<button class="seg' + (mode === "all" ? " is-on" : "") + '" data-action="hist-mode" data-mode="all">All scales</button>'
    + '<button class="seg' + (mode === "bykey" ? " is-on" : "") + '" data-action="hist-mode" data-mode="bykey">By key</button>'
    + '</div>';

  var head = ''
    + '<header class="bar">'
    + '<button class="link" data-action="go-home">\u2039 Back</button>'
    + '<h1>History</h1></header>'
    + modeToggle;

  if (mode === "bykey") return head + renderHistoryByKey();

  // ---- All mode: the full list for the current selection ----
  var sel = currentSelection();
  var pool = buildPool(sel);
  if (!pool.length) {
    return head + '<section class="card"><p class="hint">No scales in the current set. '
      + 'Pick a grade and at least one minor form on the home screen.</p></section>';
  }
  var rows = pool.map(function (it) { return historyRow(it, false); }).join("");
  return head
    + '<p class="hint subhead">Every scale in your current set. Tap one to see its full record.</p>'
    + '<section class="card histcard">' + rows + '</section>';
}

// By-key mode: pick a root, then see that key's items with their ratings.
function renderHistoryByKey() {
  var scope = state.ui.historyKeyScope || "all";
  var chosen = state.ui.historyKey;

  // source pool depends on the secondary scope toggle
  var source = (scope === "current") ? buildPool(currentSelection()) : allSyllabusItems();

  // distinct roots present in the source, in syllabus-ish order
  var order = ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb"];
  var present = {};
  source.forEach(function (it) { present[it.root] = true; });
  var roots = order.filter(function (r) { return present[r]; });
  // any roots not in the canonical order, appended
  Object.keys(present).forEach(function (r) { if (order.indexOf(r) === -1) roots.push(r); });

  var scopeToggle = '<div class="segment segment-sub">'
    + '<button class="seg' + (scope === "all" ? " is-on" : "") + '" data-action="hist-key-scope" data-scope="all">All grades</button>'
    + '<button class="seg' + (scope === "current" ? " is-on" : "") + '" data-action="hist-key-scope" data-scope="current">Current set</button>'
    + '</div>';

  var keyChips = roots.map(function (r) {
    var on = (chosen === r) ? " is-on" : "";
    return '<button class="chip' + on + '" data-action="hist-key" data-key="' + esc(r) + '">' + esc(prettyRoot(r)) + '</button>';
  }).join("");

  var body;
  if (!chosen || !present[chosen]) {
    body = '<p class="hint">Pick a key above to see how you\u2019ve done on it.</p>';
  } else {
    var items = source.filter(function (it) { return it.root === chosen; });
    // stable, readable order: major before minor, then form, then HT/R/L
    var handOrder = { HT: 0, R: 1, L: 2 };
    items.sort(function (a, b) {
      if (a.quality !== b.quality) return a.quality === "major" ? -1 : 1;
      var fa = a.form || "", fb = b.form || "";
      if (fa !== fb) return fa < fb ? -1 : 1;
      var ha = handOrder[a.hands === "together" ? "HT" : a.hand];
      var hb = handOrder[b.hands === "together" ? "HT" : b.hand];
      return ha - hb;
    });
    var showGrade = (scope === "all");
    var rows = items.map(function (it) { return historyRow(it, showGrade); }).join("");
    body = '<section class="card histcard">' + rows + '</section>';
  }

  return scopeToggle
    + '<section class="card"><h2>Key</h2><div class="chips">' + keyChips + '</div></section>'
    + body;
}

// ---- workouts screen (Build 4) ------------------------------------------

function prettyMode(mode) {
  if (mode === "due") return "Today\u2019s practice";
  if (mode === "surprise") return "Surprise me";
  if (mode === "all") return "Practise all";
  return mode;
}

function renderWorkouts() {
  var head = ''
    + '<header class="bar">'
    + '<button class="link" data-action="go-home">\u2039 Back</button>'
    + '<h1>Workouts</h1></header>';

  var log = state.sessions;
  if (!log || !log.length) {
    return head
      + '<section class="card"><p class="hint">No workouts recorded yet. '
      + 'Finish (or quit part-way through) a practice session and it\u2019ll show up here.</p></section>';
  }

  // newest first
  var entries = log.slice().reverse().map(function (w) {
    var when = new Date(w.t);
    var dstr = when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    var tstr = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    var n = w.results.length;

    // tally per rating for a compact summary line
    var tally = { struggled: 0, okay: 0, nailed: 0 };
    w.results.forEach(function (r) { if (tally[r.rating] !== undefined) tally[r.rating]++; });
    var dots = ''
      + (tally.nailed ? '<span class="tally"><span class="dot dot-nailed"></span>' + tally.nailed + '</span>' : '')
      + (tally.okay ? '<span class="tally"><span class="dot dot-okay"></span>' + tally.okay + '</span>' : '')
      + (tally.struggled ? '<span class="tally"><span class="dot dot-struggled"></span>' + tally.struggled + '</span>' : '');

    var open = state.ui.openWorkouts[w.t];
    var detail = "";
    if (open) {
      var byId = {};
      // map id -> instruction via the full syllabus item set (ids are stable)
      allSyllabusItems().forEach(function (it) { byId[it.id] = it.instruction; });
      var lines = w.results.map(function (r) {
        var label = byId[r.id] || r.id;
        return '<li><span class="dot dot-' + r.rating + '"></span>'
          + esc(label) + ' \u00b7 <span class="hint">' + esc(RATING_LABEL[r.rating]) + '</span></li>';
      }).join("");
      detail = '<ul class="trail">' + lines + '</ul>';
    }

    return '<div class="histrow" data-action="toggle-workout" data-t="' + w.t + '">'
      + '<div class="histhead">'
      + '<span class="histname">' + esc(prettyMode(w.mode)) + '</span>'
      + '<span class="histmeta hint">' + esc(dstr) + ' \u00b7 ' + esc(tstr) + ' \u00b7 '
      + n + ' scale' + (n === 1 ? "" : "s") + ' ' + dots + '</span>'
      + '</div>'
      + detail
      + '</div>';
  }).join("");

  return head
    + '<p class="hint subhead">Your past practice sessions, newest first. Tap one for the details.</p>'
    + '<section class="card histcard">' + entries + '</section>';
}

// ---- about screen -------------------------------------------------------

function renderAbout() {
  var changelog = CHANGELOG.slice(0, 3).map(function (c) {
    return '<p><strong>' + esc(c.v) + '</strong> \u2014 ' + esc(c.note) + '</p>';
  }).join("");

  var resetBlock = state.ui.resetArmed
    ? '<div class="startrow">'
      + '<button class="secondary" data-action="reset-cancel">Cancel</button>'
      + '<button class="danger" data-action="reset-confirm">Yes, erase everything</button>'
      + '</div>'
      + '<p class="hint">This clears all your ratings, schedule and settings on this device. It can\u2019t be undone.</p>'
    : '<button class="secondary" data-action="reset-arm">Reset all data</button>';

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
    + '<p>\u201cToday\u2019s practice\u201d brings back the scales you\u2019re due to review: ones you struggled with return the next day, '
    + 'and ones you nail keep stretching further out (a week, a fortnight, a month) so you spend your time where it counts.</p>'
    + '<p>Your <strong>practice plan</strong> (how many days a week you play) decides how much of what\u2019s due you take on in one sitting \u2014 '
    + 'so a big backlog is served in manageable portions rather than all at once.</p>'
    + '</section>'

    + '<section class="card">'
    + '<h2>What\u2019s new</h2>' + changelog
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
    + '<h2>Reset</h2>'
    + '<p>Start again from scratch on this device.</p>'
    + resetBlock
    + '</section>'

    + '<section class="card">'
    + '<p class="copyright">\u00a9 2026 Peter Birchley. All rights reserved.</p>'
    + '</section>';
}
