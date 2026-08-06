# VOID CASCADE — Session Log (2026-08-06)

## Overview

Completed a full visual overhaul, audio implementation, gameplay fixes, and feature additions for VOID CASCADE. Three major commits pushed to GitHub.

---

## Commit 1: Fix bloom pipeline and wave-clear enemy swarm

**Problem:** The bloom effect made the game look darker, not brighter. Wave-99 crash on clearing wave 1.

### Bloom Fix

**Defects Found:**
- **Tone mapping:** Extended Reinhard curve was dimming every pixel by up to 33% (measured: `255→172`, `128→100`)
- **Bloom reach:** Only ~16px with two fixed-size gaussian octaves; invisible on thin strokes
- **Thin stroke glow:** Ship and bullets barely registered; glow 2px from a cyan line was only `21/255`
- **Knee parameter:** Set to 0.35, threshold at 0.28, so soft-knee lower edge at -0.07 (negative). Background leaked into bloom: `[5,1,10]→[15,1,29]`

**Solutions:**
- Replaced two fixed octaves with a 6-level downsample/upsample mip pyramid (reach now ~100px)
- Switched tone curve from extended Reinhard to slope-1.0-at-black (identity below knee, only compresses overshoot)
- Clamped knee to `Math.min(knee, threshold * 0.9)` to ensure full exclusion
- Fused bright pass into 13-tap area downsample to preserve thin strokes

**Measurements:**
- Thin line glow improved: `21→53` at 2px distance (2.5× brighter)
- Background now pixel-identical: `[5,1,10]→[5,1,10]`

### Wave-Clear Bug

**Problem:** `checkWaveClear` ran every frame but respawned on a 1500ms timer. The empty-field condition stayed true for ~90 frames (at 60Hz) or 216 frames (at 144Hz): wave incremented 90–216 times, 90–216 spawn calls queued, resulting in wave 99–217 and 450–1000+ enemies at once.

**Fix:** Added `waveTransition` guard flag. Once a wave clear is detected, set the flag until `startWave()` completes the transition.

**Verification:** Clearing wave 1 through a full 216-frame transition now yields wave 2 and exactly 1 spawn call.

### Performance

- 400-frame smoke test: 0 errors, median 1.1ms, p95 2.4ms (budget: 16.67ms)

---

## Commit 2: Redesign ship/asteroids/fire, add home screen, rebindable controls, shield

### Art & Visuals

#### Ship
- **Before:** Flat triangle cursor with cyan rim
- **After:** Proper interceptor
  - Tapered fuselage with vertical metallic gradient (fakes 3D)
  - Swept wings with lit edges, wingtip lights, barb detailing
  - Twin engine nozzles (visual detail)
  - Glowing teardrop cockpit canopy

#### Thruster
- **Before:** Cyan energy ribbon
- **After:** Rocket fire
  - White-hot core (255,255,255)
  - Yellow transition (255,210,63)
  - Orange body (255,94,0)
  - Red tail-off (255,40,0)
  - Both the nozzle flame and particle exhaust

#### Asteroids
- **Before:** Neon wireframe polygons
- **After:** Matte cratered rock
  - Radial-gradient lighting (upper-left sun)
  - Dark outline (reads as solid)
  - Per-asteroid craters with lit rims
  - Deliberately kept below bloom threshold (only non-glowing thing on screen)

#### Explosions
- **Asteroid:** Layered fireball
  - 10+5×size white flash sparks
  - 22+12×size yellow core
  - 20+10×size orange body
  - 8+5×size lingering deep-red embers
  - 8+4×size matte grey rock shrapnel
- **Player death:** Same layers plus cyan ship-debris sparks
- **Enemy death:** Magenta fireworks (14 particles, white flash)

### Gameplay Features

#### Rebindable Controls
- Every action (rotate, thrust, fire, shield, pause) has two key slots
- Click a key chip on the Controls screen, press the new key
- Persisted in localStorage, reset-to-defaults button
- Global Backspace/Space suppression skipped for text inputs so typing works

#### Shield
- Default key: Backspace (rebindable)
- Everyone starts with 60 shield (kid mode 100)
- Drains ~20/sec while held
- HUD bar labelled "SHIELD"
- Ram an asteroid → destroys it (full split, normal score) at 8 + 5×size cost
- Blocks bullets at a 40-point cost (enemies), 15-point cost (asteroids)

#### Home Screen
- TOP PILOTS leaderboard (top 5) displayed directly under logo
- Escapes user text before rendering (prevent HTML injection)

### Spawn Changes
- Rift Stalkers now appear starting wave 3 (was 2)
- One at first, capped at 3 (was 5)
- Spawn spacing increased to 1500ms (was 600ms)

### Performance

- 500-frame mixed smoke (shield held, mid-run restart): 0 errors, p95 2.3ms
- All spawn timers cancelled on restart/menu/game over

---

## Commit 3: Add procedural audio, leaderboard names, gentler redesigned enemies

### Audio (Fully Procedural WebAudio)

**Zero external asset files** — everything synthesised on the fly. Runs entirely offline.

#### Sounds
- **Laser:** Square-wave zap (920→190Hz, 90ms)
- **Asteroid boom:** Size-scaled noise + sub-sine drop
  - Small: 0.3 + 0.38s decay
  - Large: 0.3 + 0.38 + (size × 0.12)
- **Enemy death:** Bandpass noise + falling sawtooth (metallic vs rock booms)
- **Shield impact:** Bandpass blip + falling sine (220→150Hz)
- **Pickup:** Rising two-note sine (540Hz, 810Hz)
- **Player death:** Big low boom (noise + sine drop)

#### Game-Over Sting
- Plays ONLY on the final (third) death
- Does NOT stack with the regular death boom
- Falling minor motif: G4 → Eb4 → C4 → G3 (sawtooth waves)
- Noise burst underneath for impact

#### Thruster
- Looped low-pass filtered noise (240Hz)
- Gain ridden by the thrust key (smooth ramping, no clicks)
- Continuous throughout gameplay

#### Music
- Dark 4-bar synth loop (Am–F–C–G)
- Bass pulse: root tones every two 8th-notes
- Sine arpeggio: 6-note pattern (×2, ×3, ×4, ×6, ×4, ×3)
- Soft tick: high-pass noise burst every 4th note
- Lookahead scheduler (8th-note grid)
- Plays only during gameplay, fades on menu/pause/game over
- Persisted fade times prevent clicks

#### Mute Control
- **M** toggles all sound
- Saved to localStorage, remembered between sessions
- Audio context initialises on first user gesture (browser requirement)
- All sound calls are safe no-ops before that

### Leaderboard Names

#### Data Structure
- Changed from bare scores to `{name, score}` entries
- Migrated old numeric saves as `{name: 'PILOT', score: N}` on load

#### Name Entry
- Qualifying game over (score makes top 10 OR score > 10th place) shows:
  - "NEW HIGH SCORE — ENTER YOUR NAME"
  - Prefilled text input (last-used name from localStorage)
  - SAVE button or Enter to submit
  - Input isolated from game keys (Backspace/Space don't trigger shield/fire)
  - Double-submit guarded

#### Display
- Home screen TOP PILOTS: names + scores
- Full high-scores screen: names + scores
- User text escaped before hitting innerHTML (no HTML injection)

### Gentler Enemies

#### Movement Tuning
- Turn rate: 0.04 → 0.022 (55% slower)
- Acceleration: 0.09 → 0.05 (44% slower)
- Kid mode scales both to 70% of normal

#### Combat Tuning
- Fire cooldown: 55–95 frames → 110–170 frames (100% longer wait)
- Attack range: 450px → 360px (20% shorter)
- Bullet speed: 7 → 5.2 (26% slower)

#### Spawn Schedule
- First appearance: wave 2 → wave 3
- Spawn count: min(1 + ⌊wave/2⌋, 5) → min(1 + ⌊(wave−3)/2⌋, 3)
- Spawn spacing: 800 + i×600ms → 1200 + i×1500ms (longer gaps)
- Result at various waves:
  - Wave 1–2: 0 enemies
  - Wave 3: 1 enemy
  - Wave 7: 3 enemies (capped)
  - Wave 15: 3 enemies (capped)

#### Visual Redesign
- **Shape:** Curved manta silhouette (swept wings, wingtip barbs)
- **Core:** Pulsing magenta rift sphere (sin-wave pulse, 65% amplitude)
- **Colour:** Magenta (#FF00AA) throughout
- **Distinction:** Deliberately different from player's hard-angled cyan interceptor
- **Trail:** Magenta exhaust, corrected from +π offset (was going forward)

### Performance

- 400-frame combat smoke (enemies, shield, audio calls live): 0 errors, median 0.8ms, p95 1.5ms
- Name entry: saved, rendered, persisted
- Spawn counts verified at 0/0/1/3/3 for waves 1/2/3/7/15

---

## GitHub Commits

```
063e630 Add procedural audio, leaderboard names, gentler redesigned enemies
baae8ff Redesign ship/asteroids/fire, add home screen, rebindable controls, shield
9230570 Fix bloom pipeline and wave-clear enemy swarm
```

All pushed to `main` on GitHub: https://github.com/SarutobiSasuke8/void-cascade

---

## Files Modified

- `play/index.html` — All gameplay, rendering, audio, UI updates
- `play/postfx.js` — Complete bloom pipeline rewrite (6-level mip pyramid)
- `STYLE_GUIDE.md` — Updated with all new art and sound specs

---

## Testing & Verification

- **Bloom:** Pixel probes measured reach, tone curves, background leakage
- **Wave bug:** Simulated 60Hz, 90Hz, 144Hz transitions; verified wave and spawn counts
- **Audio:** Graph builds, all sound functions fire without error
- **Controls:** Input isolation verified (text fields escape game keys)
- **Enemies:** Spawn counts logged at multiple wave thresholds
- **Name entry:** Save/load cycle, double-submit guard, HTML escape tested
- **Performance:** 400–500 frame smokes run at 0.8–2.4ms median/p95

---

## Known Limitations & Future Work

- **Audio mix:** No real-time audio monitoring in the Browser pane (can't hear balance). Mix balance may need adjustment based on play testing.
- **PixelLab integration:** Could generate painted sprite assets (ships, asteroids, animations), but procedural art is sufficient for now.
- **CRT scanlines:** Noted as optional/future in STYLE_GUIDE.
- **Mobile/touch:** Not yet tested; controls and UI assume keyboard + mouse.

---

## Session Date

**2026-08-06**

Model: Claude Fable 5 → Claude Haiku 4.5

