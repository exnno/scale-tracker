# Scale Trainer — MAP.md

The current file set, load order, and which function lives where. Update this
every release (same discipline as the PAT app). Read this first before opening
code, then open only what a task needs.

## Load order (fixed — boot.js always last)

Order in `index.html` and the `sw.js` ASSETS list must match:

1. `config.js` — constants, no dependencies
2. `syllabus.js` — scale data + expansion (pure)
3. `state.js` — in-memory state object + pure helpers
4. `storage.js` — localStorage load/save + export/import
5. `scheduler.js` — spaced-repetition engine + look-ahead (pure); session.js calls it
6. `session.js` — session queue + rating application + plan portion + workout log commit
7. `render.js` — all DOM drawing
8. `dispatch.js` — single delegated event handler
9. `boot.js` — integrity guard + startup (**last**)

Shared global scope: top-level `const`/`let` are visible across files. A
duplicate `const` of the same name in two files is a fatal SyntaxError that kills
a whole file — the boot integrity guard defends against shipping a half-loaded
build.

## Where things live

**config.js** — `APP_VERSION`, `BACKUP_VERSION`, storage keys (`K_SETTINGS`,
`K_RATINGS`, `K_SESSIONS`), `RATINGS`, `RATING_LABEL`, `SCOPES`,
`MIN_DPW`/`MAX_DPW`, `MAX_SESSIONS_LOGGED`, `DEFAULT_SETTINGS`, `CHANGELOG`.

**syllabus.js** — `SYLLABUS`, `SYLLABUS_DEFERRED`, `prettyRoot`, `octaveLabel`,
`itemInstruction`, `itemId`, `expandRow`, `buildPool`, `poolSize`,
`gradeRequiredForms` (Build 3 — per-grade minor-form requirement note).

**state.js** — `state` object (now incl. `settings.practiceDaysPerWeek`,
`sessions` array, `session.results`, and a transient `ui` =
`{ resetArmed, openHistory, historyMode, historyKey, historyKeyScope,
openWorkouts }`); helpers `currentSelection`, `ratingFor`, `inSession`,
`currentItem`.

**storage.js** — `lsGet`/`lsSet`/`lsRemove`; validators `validGrade`/
`validScope`/`validForm`/`validRating`/`validDaysPerWeek`; `sanitizeSettings`,
`sanitizeRatings`, `sanitizeSessions` (Build 4); `load`, `saveSettings`,
`saveRatings`, `saveSessions` (Build 4), `resetAllData`; `buildBackup`,
`exportText`, `importText` (all now include the workout log).

**scheduler.js** — `DAY_MS`, `NAIL_LADDER`, `INTERVAL`; `nailStreak`,
`intervalDaysFor`, `schedule`, `isDue`, `dueWeight`, `overdueBy`, `buildDueSet`,
`dueCount`; look-ahead `nextDueFor`, `upcomingBuckets`. *Interval model unchanged
since Build 2.*

**session.js** — `shuffled`, `applyCap`, `plannedPortion`, `startSession`
(session objects now carry `results`+`logged`), `commitWorkoutLog` (Build 4 —
logs a sitting once, on finish or quit, if >=1 rating), `endSession`,
`rateCurrent` (accumulates this sitting's result; auto-commits on finish),
`advance`, `sessionProgress`.

**render.js** — `esc`, `el`, `humanList`, `cap1`, `dueLabel`, `render`
(dispatch by `state.view`), `renderHome` (now incl. Workouts header link),
`renderSession`, `renderUpcoming`, `renderHistory` (Build 4 All/By-key toggle)
with helpers `allSyllabusItems`, `historyRow`, `renderHistoryByKey`,
`renderWorkouts` + `prettyMode` (Build 4), `renderAbout`.

**dispatch.js** — `_fileInput`, `ioMsg`, `doExport`, `doImport`,
`handleImportFile`, `clearTransientUi`, `onClick` (now incl. `set-days`,
`go-upcoming`, `go-history`, `go-workouts`, `toggle-history-row`, `hist-mode`,
`hist-key`, `hist-key-scope`, `toggle-workout`, `reset-*`), `onChange` (cap).

**boot.js** — `bootIntegrityOk`, `showBootError`, `boot`.

## Non-code assets

`index.html`, `styles.css`, `sw.js`, `manifest.json`, `icon180/192/512.png`.

## Storage keys

- `st:settings` — `{ grade, scope, minorForms[], sessionCap, practiceDaysPerWeek }`
- `st:ratings` — `{ itemId: { last, history:[{r,t}], nextDue?, interval? } }`
- `st:sessions` — Build 4 workout log: `[ { t, mode, results:[{id, rating}] } ]`,
  capped at `MAX_SESSIONS_LOGGED` (200), oldest dropped.

Backup schema (`backupVersion` **3**): `{ app, backupVersion, exportedAt,
settings, ratings, sessions }`. Fully back-compatible: a v1/v2/v3 file imports
cleanly — a pre-v4 file has no `sessions` key, which `sanitizeSessions` reads as
an empty log; a pre-v3 file also gets the default `practiceDaysPerWeek`.
