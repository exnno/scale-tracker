# Scale Trainer

A practice guide for piano scales following the ABRSM syllabus. It tells you what
to play and you play it on your own piano — there's no microphone or listening.
Mobile-first, installable, works offline.

## Current state (Build 2, v2.0.0)

- **Grades 1–3 similar-motion scales** (majors and minors).
- Pick a **grade**, choose whether to include **earlier grades**, choose which
  **minor forms** to practise (natural / harmonic / melodic — Grade 3 drops
  natural per the syllabus), and an optional **session limit**.
- **Today's practice** — an adaptive set built from what you're *due* to review.
  Scales you **struggled** with come back the next day; **okay** returns in a few
  days; **nailed** stretches further out each time (a week → fortnight → month).
  The due set is ordered weakest-first.
- **Practise all** and **Surprise me** remain as manual overrides that ignore
  due-dates.
- Work through the set one scale at a time, rating each **Struggled / Okay /
  Nailed it**. Ratings and their schedule are saved on your device.
- **Export / import** a save file to move your data or keep a backup (v2 file
  format; v1 files still import).

## Not yet built

- **Multi-day workout plan** (practice-days-per-week driving a rolling schedule) —
  a thin layer on top of the now-working scheduler, planned for v3.
- **"Complete keys (advanced)"** scope — defined in config, still parked (needs
  the all-12-keys data), planned for v3.
- Tempo target display and metronome.
- Arpeggios, contrary motion, chromatic scales (data is already prepared).
- Accounts, login, payments (deliberately deferred).

## How it's built

Vanilla HTML/CSS/JS — no frameworks, no build step, no dependencies. Single-concern
script files loading in a fixed order (`boot.js` last), shared global scope, a boot
integrity guard, `localStorage` for data, cache-first service worker for offline.
Hosted on GitHub Pages and editable from the GitHub web UI.

See `MAP.md` for the file/function map and `SCALEShandoff_v2.md` for full detail
(`SCALEShandoff_v1.md` covers the original build).

## Syllabus source

ABRSM 2021+ piano scales requirements (unchanged across the 2021–22, 2023–24 and
2025–26 syllabuses).

---

© 2026 Peter Birchley. All rights reserved.
