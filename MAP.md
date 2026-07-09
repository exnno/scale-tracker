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
6. `session.js` — session queue + rating application + plan portion
7. `render.js` — all DOM drawing
8. `dispatch.js` — single delegated event handler
9. `boot.js` — integrity guard + startup (**last**)

Shared global scope: top-level `const`/`let` are visible across files. A
duplicate `const` of the same name in two files is a fatal SyntaxError that kills
a whole file — the boot integrity guard defends against shipping a half-loaded
build.

## Where things live

**config.js** — `APP_VERSION`, `BACKUP_VERSION`, storage keys (`K_SETTINGS`,
`K_RATINGS`), `RATINGS`, `RATING_LABEL`, `SCOPES`, `MIN_DPW`/`MAX_DPW`,
`DEFAULT_SETTINGS` (now incl. `practiceDaysPerWeek`), `CHANGELOG`.

**syllabus.js** — `SYLLABUS`, `SYLLABUS_DEFERRED`, `prettyRoot`, `octaveLabel`,
`itemInstruction`, `itemId`, `expandRow`, `buildPool`, `poolSize`,
`gradeRequiredForms` (Build 3 — per-grade minor-form requirement note).

**state.js** — `state` object (now incl. `settings.practiceDaysPerWeek` and a
transient `ui` = `{ resetArmed, openHistory }`); helpers `currentSelection`,
`ratingFor`, `inSession`, `currentItem`.

**storage.js** — `lsGet`/`lsSet`/`lsRemove`; validators `validGrade`/
`validScope`/`validForm`/`validRating`/`validDaysPerWeek`; `sanitizeSettings`
(keeps dpw), `sanitizeRatings`; `load`, `saveSettings`, `saveRatings`,
`resetAllData` (Build 3); `buildBackup`, `exportText`, `importText`.

**scheduler.js** — `DAY_MS`, `NAIL_LADDER`, `INTERVAL`; `nailStreak`,
`intervalDaysFor`, `schedule`, `isDue`, `dueWeight`, `overdueBy`, `buildDueSet`,
`dueCount`; Build 3 look-ahead: `nextDueFor`, `upcomingBuckets`. *Interval model
unchanged from Build 2.*

**session.js** — `shuffled`, `applyCap`, `plannedPortion` (Build 3),
`startSession` (`"due"` now sized to `plannedPortion`), `endSession`,
`rateCurrent`, `advance`, `sessionProgress`.

**render.js** — `esc`, `el`, `humanList`, `cap1`, `dueLabel`, `render`
(dispatch by `state.view`), `renderHome` (plan card, form notes, header links,
relabelled cap), `renderSession`, `renderUpcoming` (Build 3), `renderHistory`
(Build 3), `renderAbout` (reset + changelog).

**dispatch.js** — `_fileInput`, `ioMsg`, `doExport`, `doImport`,
`handleImportFile`, `clearTransientUi`, `onClick` (now incl. `set-days`,
`go-upcoming`, `go-history`, `toggle-history-row`, `reset-arm`, `reset-cancel`,
`reset-confirm`), `onChange` (cap field).

**boot.js** — `bootIntegrityOk`, `showBootError`, `boot`.

## Non-code assets

`index.html`, `styles.css`, `sw.js`, `manifest.json`, `icon180/192/512.png`.

## Storage keys

- `st:settings` — `{ grade, scope, minorForms[], sessionCap, practiceDaysPerWeek }`
  (`practiceDaysPerWeek` added in Build 3; additive+optional, defaults to 4)
- `st:ratings` — `{ itemId: { last, history:[{r,t}], nextDue?, interval? } }`

Backup schema (`backupVersion` 2, unchanged): `{ app, backupVersion, exportedAt,
settings, ratings }`. A v1 file still imports cleanly; a pre-v3 file simply
arrives without `practiceDaysPerWeek` and gets the default.
