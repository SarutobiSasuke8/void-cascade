# TODO

Working queue for Void Cascade. Unresolved follow-ups go here rather than staying buried
in chat or a session log. Keep it short — this is a queue, not an archive.

## Now

- [ ] Audio mix balance — set by ear once the theme and SFX can actually be monitored;
      current levels were set blind (no audio monitoring in the browser pane).
- [ ] Confirm the origin and licence of `assets/audio/void_cascade_theme.mp3` and fill the
      `TODO` row in `assets/CREDITS.md`. Release blocker.
- [ ] Fill the two `TODO` constants in `docs/ASSET_PIPELINE.md` (virtual resolution, base
      sprite resolution).
- [ ] Run a full pass of `docs/PLAYTEST_CHECKLIST.md` against the current build and record
      the verdict in a session log — no checklist run exists yet.

## Next

- [ ] Shared online leaderboard — the TOP PILOTS board is `localStorage`, so every player
      only ever sees their own scores, including on GitHub Pages. A truly shared board
      needs a small backend (or a hosted service); decide whether the prototype wants one.
- [ ] Pickup collection is blocked during respawn invulnerability (pre-existing: the
      powerup loop sits below the `player.invuln` early-return in `checkCollisions`).
      Probably should collect pickups while invulnerable — decide and fix.
- [ ] Sprite art for the SPREAD / PIERCE / multiplier pickups — currently procedural
      ring-and-glyph placeholders per `STYLE_GUIDE.md`.
- [ ] Audio mix pass over the new explosion bus and the rebuilt thruster (reverb/drive/
      sub/hiss levels) — set by ear; the 2026-08-07 levels were chosen headless.
- [ ] Playtest the armoured-rock difficulty curve. `armorFor()` was tuned on paper
      (large 1→4 hits from wave 7); confirm waves 7–15 feel escalating rather than
      spongy, and that 14 large rocks still reads as "lots of asteroids".
- [ ] Touch / mobile controls — untested; UI and input currently assume keyboard + mouse.
- [ ] CRT scanline filter (optional, flagged in `STYLE_GUIDE.md`).
- [ ] Asteroid variant sprites (`asteroid_02+`) and medium/small size tiers.
- [ ] Ship skins using the accent-colour system in `STYLE_GUIDE.md`.

## Someday

- [ ] PixelLab-generated painted sprite sets (ships, asteroids, animations) — procedural
      art is sufficient for now.
- [ ] Multiplayer (coop / competitive) — explicitly secondary to single-player spectacle.
- [ ] Split `play/index.html` into modules **only if** its size starts causing real
      problems; a build step is not on the table.
