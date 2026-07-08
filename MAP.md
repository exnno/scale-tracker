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
5. `session.js` — session queue + rating application
6. `render.js` — all DOM drawing
7. `dispatch.js` — single delegated event handler
8. `boot.js` — integrity guard + startup (**last**)

Shared global scope: top-level `const`/`let` are visible across files. A
duplicate `const` of the same name in two files is a fatal SyntaxError that kills
a whole file — the boot integrity guard defends against shipping a half-loaded
build.

## Where things live

**config.js** — `APP_VERSION`, `BACKUP_VERSION`, storage keys (`K_SETTINGS`,
`K_RATINGS`), `RATINGS`, `RATING_LABEL`, `SCOPES`, `DEFAULT_SETTINGS`.

**syllabus.js** — `SYLLABUS` (raw G1–3 similar-motion data), `SYLLABUS_DEFERRED`
(contrary/chromatic/arpeggio data parked for later builds), `prettyRoot`,
`octaveLabel`, `itemInstruction`, `itemId`, `expandRow`, `buildPool`, `poolSize`.

**state.js** — `state` object; helpers `currentSelection`, `ratingFor`,
`inSession`, `currentItem`.

**storage.js** — `lsGet`/`lsSet`; validators `validGrade`/`validScope`/
`validForm`/`validRating`, `sanitizeSettings`, `sanitizeRatings`; `load`,
`saveSettings`, `saveRatings`; `buildBackup`, `exportText`, `importText`.

**session.js** — `shuffled`, `applyCap`, `startSession`, `endSession`,
`rateCurrent`, `advance`, `sessionProgress`.

**render.js** — `esc`, `el`, `render` (dispatch by `state.view`), `renderHome`,
`renderSession`, `renderAbout`.

**dispatch.js** — `_fileInput`, `ioMsg`, `doExport`, `doImport`,
`handleImportFile`, `onClick` (all data-action wiring), `onChange` (cap field).

**boot.js** — `bootIntegrityOk`, `showBootError`, `boot`.

## Non-code assets

`index.html`, `styles.css`, `sw.js`, `manifest.json`, `icon-180/192/512.png`.

## Storage keys

- `st:settings` — `{ grade, scope, minorForms[], sessionCap }`
- `st:ratings` — `{ itemId: { last, history:[{r,t}] } }`

Backup schema (`backupVersion` 1): `{ app, backupVersion, exportedAt, settings, ratings }`.
