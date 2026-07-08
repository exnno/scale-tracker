// syllabus.js — Scale Trainer
// ABRSM 2021+ similar-motion scales, Grades 1-3 (MVP scope).
// This file is DATA + pure expansion helpers only. No DOM, no storage.
// Loads early (before state/render). (c) 2026 Peter Birchley. All rights reserved.

/*
  DATA MODEL
  ----------
  SYLLABUS is the raw, human-checkable source — one entry per scale as the
  syllabus literally lists it. Each entry:
    grade   : 1 | 2 | 3
    root    : note name ("C", "G", "Bb", "Eb", "F#" ...)
    quality : "major" | "minor"
    octaves : integer (grade-specified; decision 16)
    hands   : "together" | "separately"
    minorForms (minor only): which forms the syllabus allows at that grade
              G1-2 => ["natural","harmonic","melodic"]; G3 => ["harmonic","melodic"]

  From SYLLABUS we EXPAND into rateable ITEMS (decisions 9 & 19):
    - "hands separately" splits into two items: left hand, right hand
    - "hands together" is one item
    - each selected minor FORM becomes its own item
  So one syllabus row can yield several items. Each item has a stable id so the
  scheduler and save file can key against it.

  Direction (decision: MVP) — every scale item covers ascending+descending as one
  motion, so direction is not part of the id. (Split is a documented future option.)
*/

const SYLLABUS = [
  // ---- GRADE 1 ----
  { grade: 1, root: "C", quality: "major", octaves: 1, hands: "together" },
  { grade: 1, root: "G", quality: "major", octaves: 2, hands: "separately" },
  { grade: 1, root: "F", quality: "major", octaves: 2, hands: "separately" },
  { grade: 1, root: "A", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["natural", "harmonic", "melodic"] },
  { grade: 1, root: "D", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["natural", "harmonic", "melodic"] },

  // ---- GRADE 2 ----
  { grade: 2, root: "G", quality: "major", octaves: 2, hands: "together" },
  { grade: 2, root: "F", quality: "major", octaves: 2, hands: "together" },
  { grade: 2, root: "A", quality: "minor", octaves: 2, hands: "together",
    minorForms: ["natural", "harmonic", "melodic"] },
  { grade: 2, root: "D", quality: "minor", octaves: 2, hands: "together",
    minorForms: ["natural", "harmonic", "melodic"] },
  { grade: 2, root: "D", quality: "major", octaves: 2, hands: "separately" },
  { grade: 2, root: "A", quality: "major", octaves: 2, hands: "separately" },
  { grade: 2, root: "E", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["natural", "harmonic", "melodic"] },
  { grade: 2, root: "G", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["natural", "harmonic", "melodic"] },

  // ---- GRADE 3 ---- (natural dropped for minors)
  { grade: 3, root: "D", quality: "major", octaves: 2, hands: "together" },
  { grade: 3, root: "A", quality: "major", octaves: 2, hands: "together" },
  { grade: 3, root: "E", quality: "minor", octaves: 2, hands: "together",
    minorForms: ["harmonic", "melodic"] },
  { grade: 3, root: "G", quality: "minor", octaves: 2, hands: "together",
    minorForms: ["harmonic", "melodic"] },
  { grade: 3, root: "Bb", quality: "major", octaves: 2, hands: "separately" },
  { grade: 3, root: "Eb", quality: "major", octaves: 2, hands: "separately" },
  { grade: 3, root: "B", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["harmonic", "melodic"] },
  { grade: 3, root: "C", quality: "minor", octaves: 2, hands: "separately",
    minorForms: ["harmonic", "melodic"] },
];

// Deferred data kept for later builds (NOT expanded into MVP items). Documented
// in the spec; parked here so we never re-read the syllabus. Do not surface yet.
const SYLLABUS_DEFERRED = {
  contraryMotion: [
    { grade: 1, root: "C", quality: "major", octaves: 1 },
    { grade: 2, root: "C", quality: "major", octaves: 2 },
    { grade: 3, root: "E", quality: "major", octaves: 2 },
  ],
  chromatic: [
    { grade: 2, startNote: "D", octaves: 1, hands: "separately" },
    { grade: 3, startNote: "D", octaves: 1, contrary: true },
  ],
  arpeggios: [
    { grade: 1, root: "G", quality: "major", octaves: 1, hands: "separately" },
    { grade: 1, root: "A", quality: "minor", octaves: 1, hands: "separately" },
    { grade: 2, root: "D", quality: "major", octaves: 2, hands: "separately" },
    { grade: 2, root: "A", quality: "major", octaves: 2, hands: "separately" },
    { grade: 2, root: "E", quality: "minor", octaves: 2, hands: "separately" },
    { grade: 2, root: "G", quality: "minor", octaves: 2, hands: "separately" },
    { grade: 3, root: "D", quality: "major", octaves: 2, hands: "together" },
    { grade: 3, root: "A", quality: "major", octaves: 2, hands: "together" },
    { grade: 3, root: "E", quality: "minor", octaves: 2, hands: "together" },
    { grade: 3, root: "G", quality: "minor", octaves: 2, hands: "together" },
    { grade: 3, root: "Bb", quality: "major", octaves: 2, hands: "separately" },
    { grade: 3, root: "Eb", quality: "major", octaves: 2, hands: "separately" },
    { grade: 3, root: "B", quality: "minor", octaves: 2, hands: "separately" },
    { grade: 3, root: "C", quality: "minor", octaves: 2, hands: "separately" },
  ],
};

// ---- display helpers ----------------------------------------------------

// Turn a stored root token into a nicely displayed name ("Bb" -> "B\u266d").
function prettyRoot(root) {
  return root.replace("b", "\u266d").replace("#", "\u266f");
}

function octaveLabel(n) {
  return n === 1 ? "1 octave" : n + " octaves";
}

// A compact plain-language instruction line for one item.
// e.g. "A harmonic minor \u00b7 LH \u00b7 2 oct"  /  "C major \u00b7 HT \u00b7 1 oct"
function itemInstruction(item) {
  var name;
  if (item.quality === "minor" && item.form) {
    // "A harmonic minor" reads better than "A minor (harmonic)"
    name = prettyRoot(item.root) + " " + item.form + " minor";
  } else {
    name = prettyRoot(item.root) + " " + item.quality;
  }
  var handText;
  if (item.hands === "together") {
    handText = "HT";
  } else {
    handText = item.hand === "L" ? "LH" : "RH";
  }
  var octText = item.octaves + " oct";
  return name + " \u00b7 " + handText + " \u00b7 " + octText;
}

// ---- id -----------------------------------------------------------------
// Stable, collision-free id for an expanded item. Used by scheduler + save.
// Shape: g<grade>-<root>-<quality>[-<form>]-<handsTag>
//   handsTag: "HT" (together) | "L" | "R" (separately -> per hand)
function itemId(item) {
  var parts = ["g" + item.grade, item.root, item.quality];
  if (item.form) parts.push(item.form);
  parts.push(item.hands === "together" ? "HT" : item.hand);
  return parts.join("-");
}

// ---- expansion ----------------------------------------------------------
// Expand ONE syllabus row into its rateable items (decisions 9 & 19).
function expandRow(row) {
  var out = [];
  // Determine the minor forms to expand (major => single pass with no form).
  var forms = (row.quality === "minor")
    ? (row.minorForms || ["harmonic"])
    : [null];

  forms.forEach(function (form) {
    var base = {
      grade: row.grade,
      root: row.root,
      quality: row.quality,
      octaves: row.octaves,
      hands: row.hands,
      form: form || undefined,
    };
    if (row.hands === "together") {
      var it = Object.assign({}, base);
      it.id = itemId(it);
      it.instruction = itemInstruction(it);
      out.push(it);
    } else {
      // hands separately => two items, L and R
      ["R", "L"].forEach(function (h) {
        var it = Object.assign({}, base, { hand: h });
        it.id = itemId(it);
        it.instruction = itemInstruction(it);
        out.push(it);
      });
    }
  });
  return out;
}

// Build the full item pool for a given selection.
//   opts.grade         : target grade (1-3)
//   opts.scope         : "grade" | "cumulative"  (mode 3 "complete" is future)
//   opts.minorForms    : array subset of forms the user wants to practise
//                        (filtered against what each grade allows)
// Returns a fresh array of item objects.
function buildPool(opts) {
  var grade = opts.grade;
  var scope = opts.scope || "grade";
  var wanted = opts.minorForms || ["harmonic"];

  var rows = SYLLABUS.filter(function (row) {
    return scope === "cumulative" ? row.grade <= grade : row.grade === grade;
  });

  var items = [];
  rows.forEach(function (row) {
    var r = row;
    if (row.quality === "minor") {
      // Intersect the user's wanted forms with what this grade allows.
      var allowed = row.minorForms || [];
      var use = allowed.filter(function (f) { return wanted.indexOf(f) !== -1; });
      if (use.length === 0) return; // user picked nothing valid here -> skip
      r = Object.assign({}, row, { minorForms: use });
    }
    items = items.concat(expandRow(r));
  });
  return items;
}

// Count helper for UI ("today's pool: N items").
function poolSize(opts) { return buildPool(opts).length; }
