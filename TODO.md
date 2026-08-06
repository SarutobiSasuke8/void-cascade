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
