# Scale Trainer — Handoff v1 (Build 1)

First build. The single source of truth for Scale Trainer's current state. Read
this and `MAP.md` before starting Build 2.

---

## What this build is

Build 1 of Scale Trainer: syllabus data (Grades 1–3 similar-motion scales), the
component walkthrough, the 3-way rating, and localStorage save/load with an
export/import save file. **No adaptive scheduler yet** — that's Build 2. Session
ordering here is deliberately simple (syllabus order, or shuffled for "surprise
me") so the scheduler is the only new system in the next build.

Same architecture as the PAT app: vanilla HTML/CSS/JS, no frameworks, no build
step, mobile-first PWA, cache-first service worker, GitHub Pages, editable from
the GitHub web UI. Copyright header in every file.

---

## Decisions locked (by spec number)

- **9 / 19** — rateable item = each component separately: hands-separately splits
  into left-hand and right-hand items, and each minor form (harmonic/melodic/
  natural) is its own item.
- **15** — 3-way rating: Struggled / Okay / Nailed it.
- **10** — MVP = similar-motion scales only; contrary/chromatic/arpeggios parked
  in `SYLLABUS_DEFERRED` for later.
- **16** — octave count set by grade; only the grade's version of a scale appears.
- **17** — practice scope modes. **Build 1 exposes two:** "This grade only" and
  "This grade + all previous." The third, "Complete keys (advanced)", is defined
  in `SCOPES`/config but **not yet surfaced** — it lands with Build 2.
- **6** — text instruction + tempo target model. *Note:* the tempo-target display
  is **not in Build 1** — see backlog. Instruction copy is the compact format
  ("A harmonic minor · LH · 2 oct").

---

## How it behaves

- **Home:** pick grade (1–3), pick scope (this grade / + previous), toggle minor
  forms (natural/harmonic/melodic), optional session cap. A live count shows how
  many scales are in the set. "Start practice" walks them in order; "Surprise me"
  shuffles.
- **Grade 3 natural minor:** the syllabus drops it, so `buildPool` filters natural
  out at G3 even if the user still has it toggled on — no need to change their
  saved preference. The home screen shows a one-line note explaining this at G3.
- **Session:** one scale shown large (the hero), with "Last time: …" if rated
  before, a progress bar and N/total counter, and three rating buttons. Rating
  advances automatically; reaching the end shows a completion screen.
- **About:** version, plain-language explanation, and Export/Import save file.
- **Data:** `st:settings` and `st:ratings` in localStorage. Export is
  human-readable JSON with long keys. Import validates: a foreign or garbage file
  is refused and existing data is left untouched.

---

## New/changed functions

Everything is new this build — see `MAP.md` for the full inventory. Cross-file
critical functions guarded by `bootIntegrityOk`: `buildPool`, `expandRow`,
`itemInstruction`, `sanitizeSettings`, `sanitizeRatings`, `startSession`,
`rateCurrent`, `render`.

---

## Storage

- `st:settings` = `{ grade, scope, minorForms[], sessionCap }`
- `st:ratings` = `{ itemId: { last, history:[{r,t}] } }` (history capped at 50)
- Backup schema `backupVersion` = **1**: `{ app:"Scale Trainer", backupVersion,
  exportedAt, settings, ratings }`.

Item ids are stable: `g<grade>-<root>-<quality>[-<form>]-<HT|L|R>`
(e.g. `g1-A-minor-harmonic-L`). Build 2's scheduler keys off these — don't change
the id shape without a migration.

---

## Version / cache

- `APP_VERSION` = `1.0.0` (config.js)
- `CACHE_VERSION` = `st-v1` (sw.js) — **bump every release** (`st-v2`, hotfix `st-v1-1`)
- `BACKUP_VERSION` = `1`

---

## Files in this build

`index.html`, `styles.css`, `config.js`, `syllabus.js`, `state.js`, `storage.js`,
`session.js`, `render.js`, `dispatch.js`, `boot.js`, `sw.js`, `manifest.json`,
`icon-180.png`, `icon-192.png`, `icon-512.png`, plus `MAP.md`, `README.md`, this
handoff.

---

## Deployment checklist (GitHub web UI)

1. Create/open the repo (proposed name `scale-trainer`), enable GitHub Pages.
2. Upload **file contents, not the folder**. Upload the module `.js` files and
   icons **before** `index.html` and `sw.js`.
3. Confirm `sw.js` committed with `CACHE_VERSION = "st-v1"`.
4. Wait ~1 min for Pages to redeploy.
5. On phone: install to home screen; fully close and reopen once or twice to
   settle the service worker.

---

## Post-commit test checklist (run on your phone after committing)

1. **Pool count** — switch grade 1→2→3; the count changes; the G3 natural-minor
   note appears only at G3.
2. **Forms** — toggle natural/harmonic/melodic; count updates; at G3, natural
   makes no difference to the set.
3. **Scope** — switch "this grade" vs "+ all previous"; count jumps for cumulative.
4. **Cap** — type 3 into the session limit; start practice; only 3 scales appear.
5. **Session** — start practice, rate a few (Struggled/Okay/Nailed); the "Last
   time" line shows on a repeat; progress bar advances; finishing shows the done
   screen.
6. **Persistence** — rate some scales, fully close and reopen; start the same set;
   the "Last time" ratings are still there.
7. **Export/Import** — export a save file; change some settings; import the file;
   settings and ratings return. Try importing a random file; it's refused with a
   message and your data is unchanged.

---

## Known quirks / notes

- Icons are placeholders (a simple keyboard motif) — swap for real artwork anytime.
- Scope's "Complete keys (advanced)" is intentionally not shown yet.
- No metronome and no tempo-target display yet (backlog).
- Direction is baked into each item as "ascending and descending"; there is no
  separate ascending-only / descending-only split (documented option if wanted).

---

## Carry-forward backlog (for Build 2 and beyond)

1. **Adaptive scheduler (Build 2)** — spaced-repetition over `st:ratings.history`;
   struggled resurfaces sooner, nailed stretches further. Surface the multi-day
   plan (practice-days-per-week) and wire "Complete keys (advanced)" scope here.
2. **Tempo target display** per item; then a real **metronome** (later).
3. **Arpeggios, contrary motion, chromatic** — data already parked in
   `SYLLABUS_DEFERRED`.
4. **Manual pick** UI (choose specific scales) — plumbing exists in
   `startSession("manual", items)`; needs a picker screen.
5. **2027 & 2028 ABRSM syllabus** — confirm whether scales change before leaving
   testing (unchanged across every revision since 2021).
6. **Welcome/"what's new" modal** convention if you want one for feature releases.
7. Real app icons.

---

© 2026 Peter Birchley. All rights reserved.
