# Scale Trainer

A practice guide for piano scales following the ABRSM syllabus. It tells you what
to play and you play it on your own piano — there's no microphone or listening.
Mobile-first, installable, works offline.

## Current state (Build 3, v3.0.0)

- **Grades 1–3 similar-motion scales** (majors and minors).
- Pick a **grade**, choose whether to include **earlier grades**, choose which
  **minor forms** to practise (natural / harmonic / melodic). Each grade shows
  which form(s) its syllabus actually requires, with a note that you can add
  more if you wish (Grade 3 drops natural per the syllabus).
- **Practice plan** — tell it how many days a week you play and each session
  serves about that share of what you're due, so a backlog arrives in manageable
  portions rather than all at once. A **session limit** box overrides the plan
  when you want a fixed size.
- **Today's practice** — an adaptive set built from what you're *due* to review,
  ordered weakest-first. Scales you **struggled** with come back the next day;
  **okay** returns in a few days; **nailed** stretches further out each time
  (a week → fortnight → month).
- **Upcoming** — a look-ahead showing what's due today, tomorrow, this week and
  later.
- **History** — every scale in your set with its last rating and next-due; tap
  one to see its full dated record.
- **Practise all** and **Surprise me** remain as manual overrides that ignore
  due-dates.
- Work through the set one scale at a time, rating each **Struggled / Okay /
  Nailed it**. Ratings and their schedule are saved on your device.
- **Export / import** a save file to move your data or keep a backup, and a
  **Reset** control to start again from scratch.

## Not yet built

- **Workout log** — browse a record of each past sitting (its own stored history,
  planned next).
- **"Complete keys (advanced)"** scope — defined in config, still parked (needs
  the all-12-keys data).
- Tempo target display and metronome.
- Arpeggios, contrary motion, chromatic scales (data is already prepared).
- Accounts, login, payments (deliberately deferred).

## How it's built

Vanilla HTML/CSS/JS — no frameworks, no build step, no dependencies. Single-concern
script files loading in a fixed order (`boot.js` last), shared global scope, a boot
integrity guard, `localStorage` for data, cache-first service worker for offline.
Hosted on GitHub Pages and editable from the GitHub web UI.

See `MAP.md` for the file/function map and `SCALEShandoff_v3.md` for full detail
(`SCALEShandoff_v1.md` / `SCALEShandoff_v2.md` cover the earlier builds).

## Syllabus source

ABRSM 2021+ piano scales requirements (unchanged across the 2021–22, 2023–24 and
2025–26 syllabuses).

---

© 2026 Peter Birchley. All rights reserved.
