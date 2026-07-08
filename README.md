# Scale Trainer

A practice guide for piano scales following the ABRSM syllabus. It tells you what
to play and you play it on your own piano — there's no microphone or listening.
Mobile-first, installable, works offline.

## Current state (Build 1, v1.0.0)

- **Grades 1–3 similar-motion scales** (majors and minors).
- Pick a **grade**, choose whether to include **earlier grades**, choose which
  **minor forms** to practise (natural / harmonic / melodic — Grade 3 drops
  natural per the syllabus), and an optional **session limit**.
- Work through the set one scale at a time, rating each **Struggled / Okay /
  Nailed it**. Ratings are saved on your device.
- **Surprise me** shuffles the set.
- **Export / import** a save file to move your data or keep a backup.

## Not yet built

- Adaptive practice scheduler (Build 2) — the multi-day plan that brings weak
  scales round more often, plus the "Complete keys (advanced)" mode.
- Tempo target display and metronome.
- Arpeggios, contrary motion, chromatic scales (data is already prepared).
- Accounts, login, payments (deliberately deferred).

## How it's built

Vanilla HTML/CSS/JS — no frameworks, no build step, no dependencies. Single-concern
script files loading in a fixed order (`boot.js` last), shared global scope, a boot
integrity guard, `localStorage` for data, cache-first service worker for offline.
Hosted on GitHub Pages and editable from the GitHub web UI.

See `MAP.md` for the file/function map and `SCALEShandoff_v1.md` for full detail.

## Syllabus source

ABRSM 2021+ piano scales requirements (unchanged across the 2021–22, 2023–24 and
2025–26 syllabuses).

---

© 2026 Peter Birchley. All rights reserved.
