# Scale Trainer — Handoff v3 (Build 3)

The workout-plan build, plus four supporting views/controls. Single source of
truth for Scale Trainer's current state. Read this and `MAP.md` before starting
v4. Build 1/2 detail lives in `SCALEShandoff_v1.md` / `SCALEShandoff_v2.md` and
still applies where not overridden here.

---

## What this build is

Build 3 adds **one new system: a pacing "workout plan"** on top of the Build 2
scheduler — plus four low-risk additions that are pure views or small controls
over data the app already holds. Same discipline as always: only one genuinely
new mechanism per build.

- **Workout plan (pacing).** A new `practiceDaysPerWeek` setting decides how much
  of your due backlog you tackle per sitting. "Today's practice" now serves a
  *portion* — `ceil(dueCount / practiceDaysPerWeek)` — weakest-first, instead of
  the whole due list. The session-limit box becomes a manual override.
- **Upcoming view.** A look-ahead: what's due today / tomorrow / this week / later.
- **History view.** Every scale in the current selection with its last rating and
  next-due, tap to expand the full dated rating trail.
- **Reset control.** A two-step "erase everything" on the About page.
- **Per-grade minor-form notes.** Each grade now shows which minor form(s) it
  actually requires, with a note that you can add more if you wish (generalising
  the old Grade-3-only natural-minor note).

`scheduler.js` is **untouched** — the plan is a layer over `buildDueSet`, not a
change to the interval model. Nothing about *when* a scale comes due changed.

Same architecture as before: vanilla HTML/CSS/JS, no frameworks, no build step,
mobile-first PWA, cache-first service worker, GitHub Pages, editable from the
GitHub web UI. Copyright header in every file.

---

## Decisions locked (this build's Q&A)

- **Q1 / 1A** — Reset lives on About, two-step inline confirm (tap "Reset all
  data" → reveals "Yes, erase everything" → second tap wipes). No native
  `confirm()`.
- **Q2 / 2A** — Reset clears **everything**: ratings *and* settings back to
  defaults.
- **Q3 / 3A** — Upcoming view uses **relative buckets**: Due today / Tomorrow /
  This week / Later, each with a count and the scale names.
- **Q4 / 4A** — History view: list every scale in the current selection with last
  rating (colour dot) + next-due; tap a row to expand its full rating trail.
- **Q5 / 5A** — Cap field relabelled "Session limit — leave blank to follow your
  plan"; home line reads "N due · about M this session".
- **Q6 / 6A** — "Upcoming" and "History" added as header links on Home (beside
  "About"), each its own view with a back button.
- **Q7 / 7A** — No welcome modal this build. Added a rolling changelog section to
  the About page instead (newest 3 versions).

### Plan model (locked earlier in discussion)

- **Pacing, not scheduling.** `practiceDaysPerWeek` is an *effort dial*, not a
  calendar. It never tracks which days you practise; it only sizes each sitting.
  Chosen because practice is "most days, whenever" — there's no fixed weekly
  rhythm to route around, so the scheduling model would add engine complexity for
  no benefit.
- **Auto portion** = `ceil(dueCount / practiceDaysPerWeek)`, floored at 1 so a
  non-empty due set never serves zero.
- **Manual override** = the existing session-cap field. If set (>0), it wins over
  the auto portion. Blank/0 = follow the plan.
- Skipping a day needs no handling: the plan doesn't know about days, so missed
  work simply stays in the backlog and is portioned next time. No extra settings.

---

## How it behaves (changes from v2)

- **Home:** the due card now reads "**N** due · about **M** this session" where M
  is the planned portion (or the manual cap if set). "Today's practice" serves M
  items, weakest-first. A new **Practice plan** card holds the days-per-week
  chooser (1–7). The session-limit field is relabelled as the override. Header now
  has **Upcoming** and **History** links beside **About**.
- **Upcoming view:** the current selection's items grouped into Due today /
  Tomorrow / This week (next 7 days) / Later, each showing a count and the scale
  names. Items with no schedule read as due today.
- **History view:** every item in the current selection, each row showing a
  colour dot for its last rating and its next-due (or "never practised"). Tapping
  a row expands its full dated rating trail (newest first).
- **About:** now also holds the **Reset all data** control (two-step) and a
  **rolling changelog** (v3 / v2 / v1).
- **Session, scheduler, storage schema:** behaviourally unchanged. The only
  storage touch is the additive `practiceDaysPerWeek` setting.

---

## Storage / schema

- `st:settings` gains **`practiceDaysPerWeek`** (integer 1–7, default 4).
  Additive and optional — a v1/v2 settings blob without it loads fine and gets
  the default via `sanitizeSettings`.
- `st:ratings` — **unchanged.**
- **`BACKUP_VERSION` stays 2.** No schema break: the new field is additive and
  optional, and a v2 (or v1) save file imports cleanly. Export now includes
  `practiceDaysPerWeek` inside `settings`; older importers simply wouldn't see it,
  newer ones default it.
- Item id shape **unchanged.**

---

## Version / cache

- `APP_VERSION` = `3.0.0` (config.js)
- `BACKUP_VERSION` = `2` (unchanged)
- `CACHE_VERSION` = `st-v3` (sw.js) — bump every release
- No script files added or removed this build, so the `sw.js` ASSETS list and
  `index.html` `<script>` tags are **unchanged**.

---

## New/changed functions

- **config.js** — `DEFAULT_SETTINGS.practiceDaysPerWeek = 4`; `MIN_DPW`/`MAX_DPW`
  constants; `CHANGELOG` array (About page).
- **storage.js** — `validDaysPerWeek`; `sanitizeSettings` preserves it;
  `resetAllData()` (clears both keys, restores defaults).
- **session.js** — `plannedPortion(selection)` (auto portion or manual override);
  `startSession("due")` now caps to `plannedPortion` when no manual cap is set.
- **scheduler.js** — helpers reused as-is; adds `upcomingBuckets(selection)`
  (groups the selection by relative due window) and `nextDueFor(id)`. *No change
  to the interval model.*
- **render.js** — `renderHome` (plan card, relabelled cap, new due line, header
  links); new `renderUpcoming`, `renderHistory`; `renderAbout` (reset control +
  changelog).
- **dispatch.js** — `set-days`, `go-upcoming`, `go-history`, `reset-arm`,
  `reset-confirm`, `toggle-history-row`; `resetAllData` wiring.

Cross-file critical functions guarded by `bootIntegrityOk` (unchanged list —
no new must-exist cross-file function was introduced that boot depends on;
`plannedPortion`/`upcomingBuckets` are called only from already-guarded paths).

---

## Files changed this build

- **changed:** `config.js`, `storage.js`, `session.js`, `scheduler.js`,
  `render.js`, `dispatch.js`, `styles.css`, `sw.js` (cache bump only),
  `MAP.md`, `README.md`.
- **added:** `SCALEShandoff_v3.md` (this file).
- **unchanged:** `index.html`, `manifest.json`, `state.js`, `syllabus.js`,
  `boot.js`, icons. (`state.js` needs no change — `practiceDaysPerWeek` arrives
  via `load()` → `sanitizeSettings`; the in-memory default is set there.)

*Note:* `state.js` default `settings` object is updated to include
`practiceDaysPerWeek` for first-run-before-load consistency (see below) — so it
*is* in the changed list. Kept minimal.

---

## Deployment checklist (GitHub web UI)

1. Upload the changed files. No new script files, so order doesn't matter as much,
   but still upload `sw.js` last (or after the module files) so the cache bump
   picks up already-updated assets.
2. Confirm `sw.js` has `CACHE_VERSION = "st-v3"`.
3. Wait ~1 min for Pages to redeploy.
4. On phone: fully close and reopen once or twice so the new service worker
   activates and re-caches.

---

## Post-commit test checklist (on your phone)

1. **Plan portion** — with several scales due, set days/week to 7 → "about 1–2
   this session"; set to 2 → a bigger portion. "Today's practice" serves that
   many, weakest-first.
2. **Manual override** — type a number in Session limit; it wins over the plan
   ("about N" reflects the typed number). Clear it; the plan portion returns.
3. **Portion floor** — one scale due, days/week 7: portion is 1, not 0.
4. **Upcoming** — open Upcoming; nail a scale so it pushes a week out; it moves
   from "Due today" into "This week"/"Later". Never-practised items sit in "Due
   today".
5. **History** — open History; every selection scale is listed with a last-rating
   dot and next-due; tap a rated one to see its dated trail; tap again to collapse.
6. **Reset** — About → "Reset all data" reveals a confirm; first tap doesn't wipe;
   confirm tap clears ratings AND settings back to defaults (grade 1 etc.). Reload
   confirms it stuck.
7. **Changelog** — About shows v3 / v2 / v1 notes.
8. **Form notes** — each grade shows its required form(s) with the "add more if
   you wish" note (G1/G2 harmonic; G3 harmonic, natural excluded as before).
9. **Persistence** — set days/week, close/reopen; the setting survives.
10. **Export/Import** — export (still v2 format) now includes days/week; import
    into a fresh state restores it. An old v1/v2 file still imports and days/week
    defaults to 4.

---

## Carry-forward backlog (for v4 and beyond)

1. **Workout log (v4 candidate)** — persist each completed sitting (date, items,
   ratings) as a new stored entity so "previous workouts" can be browsed. This is
   a genuine new schema (new storage key + `BACKUP_VERSION` bump) — its own build.
   Per-scale history (this build) already covers the "history over time" angle
   from the ratings data; the workout log is specifically the per-*session* record.
2. **"Complete keys (advanced)" scope (v4/v5 candidate)** — add all-12-keys data
   (transpose grade patterns across all roots), then surface the third `SCOPES`
   chip. Independent new system — likely its own build.
3. **Scheduling-model plan (optional future)** — if off-day pile-up ever becomes a
   real annoyance, graduate `practiceDaysPerWeek` from pacing to reshaping
   due-dates. Same setting, so nothing wasted.
4. **Tempo target display** per item, then a real **metronome**.
5. **Arpeggios, contrary motion, chromatic** — data parked in `SYLLABUS_DEFERRED`.
6. **Manual pick** UI — `startSession("manual", items)` plumbing exists.
7. **Welcome/"what's new" modal** convention if wanted for feature releases.
8. **2027 & 2028 ABRSM syllabus** — confirm scales before leaving testing.
9. Real app icons.

---

© 2026 Peter Birchley. All rights reserved.
