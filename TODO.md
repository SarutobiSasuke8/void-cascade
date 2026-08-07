# TODO

Working queue for Void Cascade. Unresolved follow-ups go here rather than staying buried
in chat or a session log. Keep it short — this is a queue, not an archive.

## Now

- [ ] **Playtest the wave-10 boss fight for frame rate.** It now spawns up to 9 adds
      (5 Rift Stalkers + 4 Rift Tendrils) on top of the boss — the heaviest scene in
      the game. No frame-time figure in the session logs is trustworthy: those loops
      omitted `drawBackground()`, and the preview pane cannot composite, so rAF-based
      measurement is impossible there. If it stutters, cut the phase-2 adds first.
- [ ] Collision tests must fire projectiles from outside with real velocity, stepped
      through `updateBullets()`. Placing a bullet on its target tests nothing about
      reachability — that mistake hid the invincible-boss bug through a "passing" test.

- [ ] Audio mix balance — set by ear once the theme and SFX can actually be monitored;
      current levels were set blind (no audio monitoring in the browser pane). Now also
      covers: mine beeps, crystal shatter, boss alarm/death, overcharge power-down.
- [ ] Run a full pass of `docs/PLAYTEST_CHECKLIST.md` against the current build and record
      the verdict in a session log — no checklist run exists yet. The 2026-08-07 sweep
      (hazards, crystals, boss, skins, touch, music scenes) makes this urgent.
- [ ] Playtest the wave-10 Cascade Core fight: node hp (2+tier), charge telegraph length
      (40 frames), ring-bullet density and the phase pacing were all tuned on paper.
- [ ] Playtest mines (fuse 26 frames, blast 130) and gravity wells (pull constants) —
      tuned on paper; the well pull on bullets especially needs a feel check.
- [ ] Touch controls: verify on real hardware (only synthetic TouchEvents tested);
      check button sizes/positions against actual thumbs and the cockpit frame.
- [ ] **Trim the soundtrack to loop edits.** Re-encoding is done (27MB → 16MB, VBR
      q6, cover art stripped) and loading is now lazy, so only the menu track is
      fetched up front. The remaining win is duration: all four tracks are 3.5–5.5
      minutes. Trimming each to a clean 2–2.5 minute loop would roughly halve the
      set again. **Needs your ears** — a blind cut lands mid-phrase and the loop
      seam becomes obvious.
- [ ] Check the re-encoded tracks by ear against the originals (backed up outside the
      repo, path in the session log). VBR q6 ≈ 125kbps should be transparent at game
      levels, but it is a transcode of an already-lossy SUNO export, so confirm.
- [ ] Consider a dedicated menu track. The menu currently shares
      `void_cascade_theme.mp3` with play rotation slot 1, so starting a run from the
      menu at wave 1 does not change the music at all.

## Next

- [ ] Shared online leaderboard — the TOP PILOTS board is `localStorage`, so every player
      only ever sees their own scores, including on GitHub Pages. A truly shared board
      needs a small backend (or a hosted service); decide whether the prototype wants one.
- [ ] Outstanding sprite art — tracked in `docs/SPRITE_STATUS.md`. Priority: boss set
      (ring/core/node×2), drift mine, asteroid variants 02–04, torpedo + multiplier
      pickups.
- [ ] Tune `OVERCHARGE_TIME` (currently 840 = 14s) by feel. Set on paper, not played.
      Too short and the ×3 payoff evaporates before it lands; too long and it is the
      steady state again. Also confirm the depletion underline is readable at speed.
- [ ] Decide on the multiplicative-stack cap. Overcharge bounds ×3 in *time* but not in
      *power*: while all three are overcharged the build is still ~118× base clearing
      rate, and that bullet volume is what caused the late-wave frame-time dip. Proposed
      fix: make fire rate pay for shot count, `12 × 0.62^rapid × (1 + 0.22 × spread)`.
- [ ] Playtest the armoured-rock difficulty curve. `armorFor()` was tuned on paper
      (large 1→4 hits from wave 7); confirm waves 7–15 feel escalating rather than
      spongy, and that 14 large rocks still reads as "lots of asteroids".
- [ ] CRT scanline filter (optional, flagged in `STYLE_GUIDE.md`).
- [ ] Asteroid variant sprites (`asteroid_02+`) and medium/small size tiers.
- [ ] HUD nudge verification on real screens: the 2026-08-07 safe-area move
      (`--hud-safe-x/y`) was set without pixel measurement against the cockpit art.

## Someday

- [ ] PixelLab-generated painted sprite sets (ships, asteroids, animations) — procedural
      art is sufficient for now.
- [ ] Multiplayer (coop / competitive) — explicitly secondary to single-player spectacle.
- [ ] Split `play/index.html` into modules **only if** its size starts causing real
      problems; a build step is not on the table.

## Done (2026-08-07 sweep)

- [x] Pickup collection during respawn invulnerability — fixed (`collectPowerups()` runs
      before the invuln early-return).
- [x] Touch / mobile controls — implemented; real-hardware pass still open above.
- [x] Ship skins on the accent-colour system — ION/AURORA/SOLAR/VIOLET, menu picker.
- [x] CREDITS.md theme row — made by the project owner with SUNO; reconfirm commercial
      terms only if the game is ever sold.
- [x] ASSET_PIPELINE constants — documented (native resolution capped at 2.1MP;
      1254×1254 sprite masters).
