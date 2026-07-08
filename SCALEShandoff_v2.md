# Scale Trainer — Handoff v2 (Build 2)

The adaptive scheduler build. Single source of truth for Scale Trainer's current
state. Read this and `MAP.md` before starting v3. Build 1 detail lives in
`SCALEShandoff_v1.md` and still applies where not overridden here.

---

## What this build is

Build 2 adds **one new system: a spaced-repetition scheduler** (the discipline
from Build 1 held — nothing else structural changed). It keys off the rating
`history` Build 1 was already recording, so every scale you rate now gets a
"next due" date, and the home screen can build a **"Today's practice"** set of
just what's due, weakest-first.

Everything else — architecture, file conventions, boot guard, storage model — is
unchanged from Build 1.

---

## What was carried in from the v1 backlog

- **Adaptive scheduler** ✅ done (this build).
- **"Complete keys (advanced)" scope** — deliberately **still parked**. It needs
  all-12-keys data that doesn't exist yet; surfacing the chip without that data
  would be a dead control. Deferred to v3. (`SCOPES.complete` remains defined.)
- **Multi-day workout plan** (practice-days/week) — **deferred to v3.** The
  scheduler is the foundation it sits on; building both at once was the
  two-new-systems trap. v3 layers a "how many due items per day" plan on top.
- Tempo target / metronome, arpeggios/contrary/chromatic, manual-pick UI — all
  still parked (see backlog below).

---

## The scheduler (scheduler.js — the new file)

Pure, no DOM, no storage of its own. Loads after `storage.js`, before
`session.js` (which calls it). Guarded by the boot integrity check.

**Interval model (days).** On each rating, `schedule(rec)` sets `rec.interval`
(days) and `rec.nextDue` (timestamp = now + interval):

- **struggled** → 1 day (comes back tomorrow); resets any nail streak.
- **okay** → 3 days; does not advance the nail streak.
- **nailed** → climbs a ladder by consecutive-nail streak:
  `7 → 14 → 30 → 60` days, capping at 60. One struggle resets to the bottom.

Tune these via `NAIL_LADDER` and `INTERVAL` at the top of the file — one dial each.

**Due logic.** `isDue(id)` is true when `nextDue <= now`, **or** when the item has
no record / no `nextDue` (never practised → always due). `buildDueSet(selection)`
filters the current pool to due items and orders them weakest-first:
`struggled → never-practised → okay → nailed`, ties broken most-overdue-first.
`dueCount(selection)` is the count for the home line.

---

## How it behaves (changes from v1)

- **Home:** the pool card now leads with **"N scales due today"** and a big
  **"Today's practice"** button (disabled, showing "all caught up", when nothing
  is due). Below a divider, **"Practise all N"** and **"Surprise me"** remain as
  manual overrides that ignore due-dates (unchanged behaviour, restyled as
  secondary).
- **Session:** identical to v1 — one hero instruction, "Last time…", progress,
  three rating buttons. The only difference is invisible: rating now also writes
  the schedule.
- **"due" session mode:** `startSession("due")` builds from `buildDueSet` (already
  ordered, so no reshuffle). `"all"`, `"surprise"`, `"manual"` unchanged. The
  session cap still applies to all modes.
- **About:** version now 2.0.0, plus a paragraph explaining the review schedule.

---

## Storage / schema

- `st:ratings` record gains two **optional** fields:
  `{ last, history:[{r,t}], nextDue, interval }`. Optional is deliberate — a v1
  record (no scheduling fields) loads fine and reads as "due now", so existing
  users lose nothing and simply get everything surfaced on first open.
- `sanitizeRatings` now preserves `nextDue` (number) and `interval` (positive
  number) when present, drops them otherwise.
- **`BACKUP_VERSION` = 2.** Import still accepts a v1 file (fields it doesn't
  find are simply absent). `importText` is unchanged in shape.
- Item id shape is **unchanged** — the scheduler keys off the same stable ids.

---

## Version / cache

- `APP_VERSION` = `2.0.0` (config.js)
- `BACKUP_VERSION` = `2` (config.js)
- `CACHE_VERSION` = `st-v2` (sw.js) — bump every release
- `scheduler.js` added to the `sw.js` ASSETS list and to `index.html` (before
  `session.js`), and to the boot integrity list.

---

## Icon fix (incidental)

The image files are `icon180.png` / `icon192.png` / `icon512.png` (no hyphen),
but v1's `manifest.json` and `index.html` referenced the hyphenated names
(`icon-180.png` …), so the install icon and apple-touch-icon were 404ing
silently. References are now corrected to the real filenames. If you ever rename
the image files, update `manifest.json` and `index.html` to match.

---

## Files changed / added this build

- **added:** `scheduler.js`, `SCALEShandoff_v2.md`
- **changed:** `config.js` (versions), `storage.js` (sanitizeRatings),
  `session.js` (schedule call + "due" mode), `render.js` (home card + About),
  `dispatch.js` (`start-due`), `styles.css` (due layout), `index.html` (script +
  icon ref), `sw.js` (cache bump + asset), `boot.js` (integrity list),
  `manifest.json` (icon refs), `MAP.md`, `README.md`.

---

## Deployment checklist (GitHub web UI)

1. Upload the **new** `scheduler.js` and the **changed** files listed above.
   Upload module `.js` files **before** `index.html` and `sw.js`.
2. Confirm `sw.js` has `CACHE_VERSION = "st-v2"`.
3. Wait ~1 min for Pages to redeploy.
4. On phone: fully close and reopen once or twice so the new service worker
   activates and re-caches (including `scheduler.js`).

---

## Post-commit test checklist (on your phone)

1. **First open after update** — everything shows as due (existing ratings had no
   schedule yet); "N due today" equals the pool count.
2. **Nail a scale** — finish it rated "Nailed it", return home; the due count
   drops by one and that scale won't reappear in "Today's practice" until its
   interval passes.
3. **Struggle a scale** — rate "Struggled"; it stays due (returns next day).
4. **Weakest-first** — with a mix rated, start "Today's practice"; struggled ones
   come first, nailed ones (if any are due) last.
5. **All caught up** — once nothing is due, the button greys out and reads "all
   caught up"; "Practise all" / "Surprise me" still work.
6. **Cap** — set a session limit; "Today's practice" honours it.
7. **Persistence** — rate some, fully close/reopen; due counts and intervals
   survive.
8. **Export/Import** — export (now v2); import into a fresh state; schedule
   returns. Import an old **v1** save file; it loads and those items read as due.

---

## Carry-forward backlog (for v3 and beyond)

1. **Multi-day workout plan** — practice-days-per-week decides how many due items
   to serve per sitting; a light layer over `buildDueSet`.
2. **"Complete keys (advanced)" scope** — add the all-12-keys data (transpose the
   grade patterns across all roots), then surface the third `SCOPES` chip.
3. **Tempo target display** per item, then a real **metronome**.
4. **Arpeggios, contrary motion, chromatic** — data parked in `SYLLABUS_DEFERRED`.
5. **Manual pick** UI — `startSession("manual", items)` plumbing exists; needs a
   picker screen.
6. **Scheduler tuning** — `NAIL_LADDER`/`INTERVAL` are single dials; revisit once
   there's real usage. Possible "reset schedule" control in About.
7. **2027 & 2028 ABRSM syllabus** — confirm scales before leaving testing
   (unchanged across every revision since 2021).
8. Real app icons.

---

© 2026 Peter Birchley. All rights reserved.
