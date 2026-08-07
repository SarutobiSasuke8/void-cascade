---
title: Session Log - Weapon stacks, scoring systems, audio upgrade, cockpit HUD
date: 2026-08-07
status: complete
type: session-log
mutability: append-only
project: void-cascade
agent: Claude Code (Fable 5)
tags:
  - session-log
---

# Session Log - Weapon stacks, scoring systems, audio upgrade, cockpit HUD

## Executive Summary

Implemented the user's 14-point improvement list in one coherent change to
`play/index.html`: a stackable, death-persistent weapon system (RAPID / SPREAD / new
PIERCE), torpedoes that vaporise rocks outright with a blast wave, an end-of-wave bonus
tally, random score-multiplier stars, extra ships every 20k points, a rescuable lost
starfighter, a torpedo icon rack in the HUD, a CSS cockpit frame, a 1.18× ship visual
scale, menu-music autoplay handling, and a procedural audio upgrade (reverb, soft-clip,
stereo pan, sub-bass, master compressor). Verified headless in the browser pane: zero
console errors, clean restart state, frame-rate-independent fire, median 1.2ms frame.

## Trigger

User supplied a bullet list of 14 desired improvements plus one question (is the GitHub
Pages leaderboard shared between players? — answer: no, it is `localStorage`, per
browser/device).

## Starting State

- Branch `main` at `bbe4118`, clean tree.
- Single-file game (`play/index.html`, 1815 lines) + `play/postfx.js`; no build step.
- Rapid fire existed as a 300-tick timed buff; torpedoes split asteroids like bullets;
  no multipliers, no extra lives, no wave tally; HUD torpedoes were a number.

## Work Completed

- **Weapon system**: `player.weapons = {rapid, spread, pierce}` stack counts (max ×3),
  persist until the ship is lost (`resetPlayer` clears them), combine freely.
  RAPID: refire 12 → ×0.62/stack. SPREAD: 3/5/7-bullet fan (0.13 rad step).
  PIERCE (new): bullets survive N impacts, rendered plasma-blue. Drop table now
  shield 32% / torpedo 20% / rapid/spread/pierce 16% each of the 12% (22% kid) roll.
- **Torpedoes**: direct hit calls new `vaporizeAsteroid` (no children, 150×size×wave)
  plus a 110px blast wave that bullet-grade-splits neighbours (children provably cannot
  be re-hit by the same blast — countdown loop, pushes land past the start index).
- **Scoring**: all gains funnel through `addScore()` — applies the multiplier and the
  every-20,000-points extra-ship check. Multiplier stars (max ×5, 12s refresh, lost on
  death) and the lost starfighter (+1 ship) spawn from randomised edge timers.
- **Wave tally**: on clear, `WAVE n CLEAR / BONUS +x` (250×wave) counts up on the game
  canvas with tick sounds over a 3.4s transition; field stays playable.
- **HUD**: torpedo icon rack (rotated sprite icons), weapons line, gold ×N multiplier
  next to the score (blinks when expiring), canvas toasts for rewards.
- **Cockpit frame**: pure-CSS corner brackets + hairline edges, `pointer-events: none`.
- **Ship**: 1.18× visual scale via `ctx.scale`; collision radius unchanged at 14.
- **Audio**: shared explosion bus (tanh waveshaper, positional StereoPanner, send into a
  generated 1.1s decaying-noise convolver reverb), sub-sine layer + debris crackle per
  boom, DynamicsCompressor on master; new tick / extra-ship / multiplier cues.
- **Menu music**: `AudioFX.init()` now runs at load, `ensureMusic()` re-plays the theme
  once the context is actually running (recovers from a blocked early `play()`), and a
  pulsing hint shows until audio is live. Music still cannot start before a gesture on
  first visit — browser autoplay policy, not a bug.
- **Docs**: STYLE_GUIDE (3 new sections + sound update), README gameplay list, TODO.

## Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| Weapon stacks persist through a wave but reset on death | User asked "persistent until you get destroyed"; also the natural difficulty valve | If runs snowball too hard |
| Hitbox stays 14 despite 1.18× visual ship | Forgiving hitbox is standard arcade practice; a bigger hitbox would be a stealth difficulty increase | If players report "that should have hit me" |
| Third weapon = PIERCE (not homing/laser) | Zero new entity types, reuses bullet path, visually readable via colour | More weapon variety requested |
| Multiplier resets to ×1 on death and on timer expiry | Classic arcade risk/reward; keeps ×5 meaningful | If it feels too punishing |
| Blast-split neighbours with `playSound=false` | Torpedo boom is the sound; 4 overlapping booms were mud | — |
| Extra ship every 20,000 (multiplied) points | Wave-scaled scores reach it every few waves mid-game | After real playtesting |
| Cockpit frame always visible (menus too) | Consistent cockpit fiction, zero canvas cost | If it fights the menu art |

## Files Touched

| File | Change |
|---|---|
| `play/index.html` | All gameplay/HUD/audio changes (~+420 lines) |
| `STYLE_GUIDE.md` | Weapon Power-ups, Score Events, Cockpit Frame sections; sound chain update |
| `README.md` | Two bullets in Core Gameplay |
| `TODO.md` | 4 new follow-ups (shared leaderboard backend, invuln-pickup quirk, pickup sprites, audio mix pass) |

## Verification

Headless in-pane playtest (pane not composited, so no screenshots — drove `loop()`
manually at a virtual 1280×800 with stubbed rAF, then reloaded the page clean):

- Boot: zero console errors; all globals present.
- SPREAD ×1 fires exactly 3 bullets; RAPID ×2 cooldown 4.61 ticks (12×0.62²) ✓.
- PIERCE: bullet survives an asteroid kill with pierce 2→1 ✓.
- Torpedo: large rock vaporised with **no children**; neighbour inside 110px split into
  2 mediums; score +600 (450 vaporise + 150 split at wave 1) ✓.
- Multiplier: pickup → ×2, HUD shows gold "×2", timer 719, `addScore(1000)` → +2000 ✓.
- Starfighter: +1 ship, toast fired ✓. Death: weapons and multiplier cleared ✓.
- Extra ship at 20k threshold ✓. Wave tally: created on clear, counts to exactly
  250×wave, wave advances by exactly one ✓.
- Restart after game over: every new field (mult, timers, tally, toasts, weapons,
  special-spawn timers) back to initial values ✓.
- Frame-rate independence: exactly 10 shots in 2 simulated seconds at 60, 90 and 144Hz ✓.
- Frame-time smoke, 450 busy frames (14 large rocks, 3 stalkers, max rapid+spread):
  median 1.2ms, p95 3.5ms ✓.
- Zero console errors after the full abuse run.

Playtest checklist verdict: **pass with issues** — audio levels and the on-screen look
of the new elements could not be humanly monitored (headless pane); pixel probes for
background purity not run (background/postfx untouched). Flagged in TODO.

## Open Threads

| Thread | Next Step |
|---|---|
| Shared leaderboard | Needs a backend; decide if wanted (TODO) |
| Invuln blocks pickup collection | Decide intended behaviour, likely allow (TODO) |
| Audio mix of new bus | Set by ear in a real session (TODO) |
| Pickup sprites for spread/pierce/mult | Art pass (TODO) |

## What Worked

- Driving `loop()` manually with a stubbed `requestAnimationFrame` gave exact,
  assertable playtests (shot counts, scores, state resets) despite no visible pane.
- Funnelling score through one `addScore()` made multiplier + extra-life impossible to
  miss from any call site.

## What To Do Differently

- The pickup-vs-invulnerability interaction was only caught because a test happened to
  leave `invuln` high — worth a dedicated checklist line for pickup collection.

## Connected

- Builds on `2026-08-06-session-log-visual-overhaul-audio-gameplay.md` (bloom pipeline,
  procedural audio foundation, wave-clear guard this session's tally extends).

---

## Update — 2026-08-07 (same day): balance, late-wave performance, thrust, text legibility

Player feedback after previewing the build above: too many extra lives, lives too cheap,
no life cap, late-wave slowdown, no audible thrust, and the wave-clear text too glowy to
read.

### Root cause of the late-wave slowdown (measured, not guessed)

Profiling at waves 1/6/12/18 showed median frame time was fine (6–7ms) but **p95 rose
from 8ms at wave 6 to 97ms at wave 12** — 10fps stutters. Splitting the frame into
phases showed no single hot phase: update, world draw, particle draw and postfx all
spiked *together*, which is the signature of garbage collection, not algorithmic cost.

The source: `spawnParticles` emits **~870 particles for one large asteroid's full split
chain**, so eight rocks dying together produced **6,976 particles in a single frame** —
14.9ms of draw plus the churn of allocating that many objects and `splice`-ing them out
one at a time. Wave count compounded it: `3 + wave*2` meant 39 large rocks at wave 18,
up to 273 rocks once split.

### Changes

- **Particle pooling + budget**: objects come from a free list, dead ones are
  swap-removed (O(1), not `splice`), bursts thin proportionally above 1,400 with a hard
  ceiling of 2,400. A single explosion is never thinned, only overlapping ones.
- **Armoured asteroids** (the user's own suggestion): large-rock count plateaus at 14
  (~wave 6); past that `armorFor()` hardens rocks — large 1→4 hits, medium 1→2, small
  always one-shot, Kid Mode never armoured. Armour shows as crack-energy `#00FFCC`
  fissures that brighten as it wears down, with a metallic *clank* distinct from the
  shatter boom, and chip damage scores 15×wave so it never feels inert.
  New `damageAsteroid()` is the single entry point; shield-ram and torpedo direct hits
  still ignore armour, the torpedo blast wave deals 2.
- **Life economy**: first extra ship at 50,000 (was 20,000), each subsequent one 60%
  dearer (50k → 130k → 258k → 463k …); **lives cap at 9**; the threshold advances even
  when capped so spending a life cannot trigger a burst of banked awards. Lost
  starfighter rate halved (~80–140s), does not spawn at the cap, and pays 5,000 points
  instead if collected at the cap.
- **Thrust rebuilt**: low-pass body + bandpass air-hiss + 46Hz sub, 7.5Hz flicker LFO,
  fast attack / slow release, hiss and sub thickening with ship speed, light reverb send.
  Gain 0.16 → 0.5.
- **Wave tally and toasts moved to DOM.** See below.

### The text legibility finding

The first attempt kept the tally on the canvas and added a dark outline with pulled-back
fills. Pixel probes proved that barely worked: fully-saturated pixels in the headline
band went only 13.39% → 12.32%, and average glow fell 4.5%. The bloom pass re-blows out
anything above its 0.40 threshold regardless of the starting colour, and neon text is
far above it. Moving both the tally and the toasts to DOM overlays (rendered *after*
postfx, with a controlled CSS `text-shadow`) fixed it outright — the canvas band now
measures 68 lit pixels instead of thousands. Recorded as a standing rule in
`STYLE_GUIDE.md`: canvas is for the world, DOM is for words the player must read.

### Verification

- **Late-wave performance**: wave 12 p95 96.9ms → 13.9ms. Isolating the game's own
  update+draw from the WebGL pass at wave 18 worst case (14 large armoured rocks, 3
  stalkers, max rapid+spread, field continuously topped up): **median 2.0ms, p95 18.5ms**;
  in a cleaner run, simulation median 0.3ms / p95 1.4ms and canvas draw median 1.0ms /
  p95 3.2ms. Residual 90ms–1000ms outliers were traced to `postfx.render` in a
  non-compositing preview pane and did **not** correlate with entity load (worst frames
  had 10–26 particles, 16–17 rocks) — environment artifact, not game code.
- Particle mass-kill now caps at exactly 2,400 (was 6,976), peak draw 5.3ms (was 14.9ms);
  pool recycles and drains to zero.
- Armour table verified: large `1:1 4:1 6:1 7:2 10:3 13:4 18:4`, medium `10:2 13:2`,
  small always 1, Kid Mode always 1. A wave-13 large survives 3 hits and dies on the 4th.
- Wave counts plateau: `1:5 3:9 6:14 10:14 18:14`.
- Life thresholds 50k → 130k → 258k → 462.8k → 790.5k → 1.31M; cap holds at 9; starfighter
  suppressed at cap; pays points at cap; still spawns below cap.
- Tally/toasts: DOM-rendered, capped at 4 toasts, cleared on death, restart and quit;
  canvas band 68 lit pixels (was thousands).
- Frame-rate independence re-confirmed: exactly 10 shots per 2s at 60/90/144Hz.
- Clean restart across all new fields; zero console errors.

Playtest checklist verdict: **pass with issues** — unchanged caveat, the audio mix and
the on-screen look still need a human pass (headless pane, no monitoring).

### Open threads added

| Thread | Next Step |
|---|---|
| Armour difficulty curve tuned on paper | Playtest waves 7–15 for spongy-vs-escalating (TODO) |
| Thruster + explosion mix levels | Set by ear in a monitored session (TODO) |
