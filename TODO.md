# TODO

Working queue for Void Cascade. Unresolved follow-ups go here rather than staying buried
in chat or a session log. Keep it short — this is a queue, not an archive.

## Now

- [ ] **Playtest the 2026-08-07 difficulty pass** (from the wave-26 feedback run: 3M pts,
      "waves 11+ surprisingly easy when well armed"). Changed in one sweep: lives cap
      9→5, ×2 weapon tier now decays to ×1 over 30s (`TIER2_TIME`, cyan HUD underline,
      refreshed by re-pickup; ×1 stays permanent; Kid Mode exempt), mines 27% larger
      with a magenta halo, tier badges on both enemy species (Stalker: aura + tail rank
      chevrons; Tendril: brighter seams + the same chevrons — tier 2 = one, tier 3 =
      two), and Void Iron replacing the crystals. Feel check: waves 11+ should have real
      pressure without being unfair. **Judge these together before pulling another
      difficulty lever** — four changes landed on the same wave band at once.
      Tune `TIER2_TIME` first if the decay feels naggy — 30s was set on paper.
- [ ] **Playtest Void Iron** (replaced the Void Crystals — the "polygonal asteroids"
      from the wave-26 run were the crystals, now removed). Feel questions, in order:
      is 5–8 hits *work* or a *chore*? Is the 18→30% share right, or does the field
      start to feel like a wall around wave 25? Does the plated silhouette read as
      "armoured" at a glance without the dedicated sprite? Knobs: `heavyArmorFor()`,
      the `ironShare` ramp in `startWave()`, and the 0.65 drop chance.
- [ ] **Void Iron sprite** — the only outstanding gameplay art. Full brief in
      `docs/SPRITE_STATUS.md`; the code already looks for
      `assets/asteroids/large/void_iron_01.png` and swaps to it automatically. The
      critical constraint for Codex: **stay matte (max channel ≤ 0.40) and bake NO
      glowing seams** — the engine draws the crack-energy and brightens it with damage.
- [ ] Latent: the Rift Tendril's shielded-ram bounce (`checkCollisions()`) divides by
      `(contactDist || 1)`, so a dead-centre overlap yields a zero push vector and the
      player never separates. Same bug I fixed on the Void Iron ram path; left alone
      here because it is pre-existing and unrelated to this change. Fix by falling back
      to `player.angle` when `contactDist` is ~0.
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

- [ ] **Dedicated wave-20 boss** instead of a re-tiered Cascade Core. Direction to
      protect: a *different verb*, not bigger numbers. Sketch — "The Rift Matriarch":
      a mobile creature boss (contrast to the Core's rotating fortress) that births
      Tendrils, has one moving weak point that only opens during its lash attack,
      and uses the gravity-well mechanic offensively. Wave 30+ can then alternate
      Core/Matriarch tiers so neither fight goes stale. Needs: design pass, Codex art
      set, its own escalation table, and a second boss music stinger.
- [ ] **Difficulty escalation levers for waves 11+** (beyond the ×2 decay). Candidates,
      cheapest first: (a) scale powerup drop rate down when the player is at full
      stacks — pressure without new entities; (b) wave modifiers every ~5 waves
      ("crystal storm", "minefield", "well cluster") so late waves change texture,
      not just numbers; (c) tier-4 enemy row at wave 31+; (d) let late-tier Stalkers
      lead their shots (aim at projected position). Rubber-band AI is off the table —
      it punishes skill.
- [ ] Consider making the score multiplier kill-refreshed rather than a flat 12s
      timer (combo language: kills keep it alive, dry spells end it). Would make ×5
      an achievement of sustained aggression instead of pickup luck. Decide after
      the ×2 weapon decay has been felt — one economy change at a time.
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
