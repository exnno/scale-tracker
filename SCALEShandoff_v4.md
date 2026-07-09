# Scale Trainer — Handoff v4 (Build 4)

The workout-log build, plus a History All/By-key view. Single source of truth for
Scale Trainer's current state. Read this and `MAP.md` before starting v5. Earlier
detail lives in `SCALEShandoff_v1..3.md` and still applies where not overridden.

---

## What this build is

Build 4 adds **one new system: a persisted workout log** — every practice
session is now recorded so you can look back at what you did and how it went. It
also reworks the **History** screen with an **All / By key** toggle (pure view
work over existing data). Discipline held: one genuinely new stored entity.

- **Workout log.** A new `st:sessions` array. Any sitting with at least one
  rating is logged — including partials (quit part-way) — capturing the date,
  the mode (Today's practice / Practise all / Surprise me) and the per-scale
  ratings *for that sitting*. Browsable in a new **Workouts** view.
- **History All / By key.** A top toggle: **All scales** (the existing full list
  for the current selection) and **By key** (pick a root, see that key's items).
  By-key has its own secondary toggle: **All grades** (draws from the whole G1–3
  syllabus, with grade tags) or **Current set** (just your selection).

Same architecture as always: vanilla HTML/CSS/JS, no frameworks, no build step,
mobile-first PWA, cache-first SW, GitHub Pages, phone-editable. Copyright header
in every file. **No new script files** — the log fits into existing files — so
`index.html` and the `sw.js` ASSETS list are unchanged.

---

## Decisions locked (this build's Q&A)

- **History split** — two modes on the History screen: **All** | **By key**
  segmented toggle. All = current long list unchanged.
- **By-key item source** — a **toggle**: All grades (whole syllabus, grade-tagged)
  or Current set (buildPool of the current selection).
- **What counts as a loggable workout** — **any sitting with ≥1 rating**, partials
  included. A zero-rating session logs nothing.
- **Where the log lives** — its **own "Workouts" screen** via a new header link
  (Upcoming · History · Workouts · About). *(We briefly considered a combined
  "Progress" screen; decided against — kept the three as separate links.)*
- **Log entry contents (default A–F, all accepted)** — timestamp, mode, and the
  per-scale results `[{id, rating}]`. Logged on any exit (finish or quit). Capped
  at the most recent **200** sittings. New key `st:sessions`; `BACKUP_VERSION`
  **2 → 3**. Empty state before anything's logged.

---

## The workout log (how it works)

- **Accumulation.** Each active `state.session` carries a `results` array.
  `rateCurrent` pushes `{id, rating}` for *this* sitting as you go — deliberately
  separate from the per-item all-time ratings, so the log records what happened
  in the session, not each scale's latest rating elsewhere.
- **Commit.** `commitWorkoutLog()` writes one entry, once, if `results` is
  non-empty. It fires from **two** paths: automatically when the final item is
  rated (so a sitting is saved even if the app is closed on the done screen), and
  from `endSession()` (covering quit part-way and the done-screen "Back to
  start"). A `logged` flag on the session prevents any double-commit; an empty
  session sets the flag without writing.
- **Cap.** Trimmed to `MAX_SESSIONS_LOGGED` (200) on both write and load, oldest
  dropped — same bounded-history discipline as per-item rating history (50).

---

## Storage / schema

- **New key `st:sessions`** — `[ { t:number, mode:string, results:[{id, rating}] } ]`.
- `sanitizeSessions` validates each entry: numeric `t`, string `mode` (defaults
  "all"), and `results` filtered to `{id:string, rating:valid}`; an entry with
  zero valid results is dropped. Non-array input → `[]`. Trimmed to the cap.
- `st:settings` and `st:ratings` — **unchanged.**
- **`BACKUP_VERSION` = 3.** `buildBackup`/`exportText` now include `sessions`;
  `importText` restores them via `sanitizeSessions`. **Fully back-compatible:** a
  v1/v2/v3 save file has no `sessions` key → imports as an empty log (and a
  pre-v3 file still gets the default `practiceDaysPerWeek`). A relaxed superset of
  the old validator, so older backups restore cleanly.
- `resetAllData` now also clears `st:sessions`.
- Item id shape **unchanged** — the log keys off the same stable ids, so
  Workouts detail maps `id → instruction` via the syllabus.

---

## Version / cache

- `APP_VERSION` = `4.0.0` (config.js)
- `BACKUP_VERSION` = `3` (config.js)
- `CACHE_VERSION` = `st-v4` (sw.js) — bump every release
- **No script files added/removed** → `sw.js` ASSETS list and `index.html`
  `<script>` tags unchanged.

---

## New/changed functions

- **config.js** — `K_SESSIONS`, `MAX_SESSIONS_LOGGED`; version/backup bumps;
  new `CHANGELOG` top entry.
- **state.js** — `sessions:[]`; `session.results`/`logged`; `ui` gains
  `historyMode`, `historyKey`, `historyKeyScope`, `openWorkouts`.
- **storage.js** — `sanitizeSessions`, `saveSessions`; `load`/`resetAllData`/
  `buildBackup`/`importText` extended for the log.
- **session.js** — `commitWorkoutLog`; `startSession` seeds `results`/`logged`;
  `rateCurrent` accumulates + auto-commits on finish; `endSession` commits.
- **render.js** — `renderHistory` reworked (All/By-key) with `allSyllabusItems`,
  `historyRow`, `renderHistoryByKey`; new `renderWorkouts`, `prettyMode`; home
  header gains the Workouts link; render dispatch handles `"workouts"`.
- **dispatch.js** — `go-workouts`, `hist-mode`, `hist-key`, `hist-key-scope`,
  `toggle-workout`.
- **boot.js** — integrity list adds `sanitizeSessions`, `commitWorkoutLog`.
- **styles.css** — `.segment`/`.seg`, `.gradetag`, `.tally`.

---

## Files changed this build

- **changed:** `config.js`, `state.js`, `storage.js`, `session.js`, `render.js`,
  `dispatch.js`, `boot.js`, `styles.css`, `sw.js` (cache bump only), `MAP.md`,
  `README.md`.
- **added:** `SCALEShandoff_v4.md`.
- **unchanged:** `index.html`, `manifest.json`, `syllabus.js`, `scheduler.js`,
  icons.

---

## Deployment checklist (GitHub web UI)

1. Upload the changed files (contents, not folder). No new scripts, so order is
   flexible, but commit `sw.js` last so the cache bump picks up updated assets.
2. Confirm `sw.js` has `CACHE_VERSION = "st-v4"` and `config.js` shows
   `APP_VERSION = "4.0.0"`.
3. Wait ~1 min for Pages to redeploy.
4. On phone: fully close and reopen **twice** (close-open-close-open) so the new
   service worker activates. If it still shows v3, open the plain Pages URL in the
   browser (add `?v=4` to bust cache), confirm v4, then reopen the installed app;
   last resort is delete + reinstall the PWA (localStorage data survives).
   **The About-page version number is the reliable "it shipped" tell.**

---

## Post-commit test checklist (on your phone)

1. **Version** — About shows 4.0.0 and the v4 changelog line.
2. **Log a full session** — run Today's practice, rate every scale; return to
   Workouts; the sitting is listed with date/time, mode, count and a rating tally.
   Tap it → per-scale results.
3. **Log a partial** — start a session, rate 2–3, tap Quit; Workouts shows that
   sitting with just those scales.
4. **Zero-rating** — start a session, Quit immediately (rate nothing); no new
   Workouts entry.
5. **Mode labels** — a "Surprise me" and a "Practise all" sitting show their
   correct labels in the log.
6. **History All** — History opens in All mode = the familiar full list.
7. **History By key** — switch to By key; pick a key; see its items with ratings.
   Toggle All grades ↔ Current set: All grades shows grade tags and may include
   scales outside your current grade (expected); Current set matches home.
8. **Export/Import** — export (now v3 format); confirm the file contains
   `sessions`; import into a fresh state → workouts return. Import an **old v2/v3**
   file → loads fine, workout log simply empty.
9. **Reset** — About → reset; Workouts, ratings and settings all cleared.
10. **Persistence** — log a couple, fully close/reopen; the log survives.

---

## Carry-forward backlog (for v5 and beyond)

1. **"Complete keys (advanced)" scope** — add all-12-keys data (transpose grade
   patterns across all roots), then surface the third `SCOPES` chip. Independent
   new system; its own build. Design Qs to settle first: forms/octaves for
   non-syllabus keys, enharmonic spellings.
2. **Header crowding** — four links (Upcoming/History/Workouts/About) is the most
   the header should hold on a narrow phone; if it feels tight, consider shorter
   labels or the combined "Progress" screen we deferred.
3. **Scheduling-model plan** (optional) — graduate `practiceDaysPerWeek` from
   pacing to reshaping due-dates if off-day pile-up ever bites.
4. **Tempo target display**, then a **metronome**.
5. **Arpeggios, contrary motion, chromatic** — data parked in `SYLLABUS_DEFERRED`.
6. **Manual pick** UI — `startSession("manual", items)` plumbing exists.
7. **Workout log extras** (if wanted) — filter by mode, a simple streak/《days
   practised》count, or per-day grouping.
8. **2027 & 2028 ABRSM syllabus** — confirm scales before leaving testing.
9. Real app icons.

---

© 2026 Peter Birchley. All rights reserved.
