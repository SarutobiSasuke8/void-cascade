# VOID CASCADE — Visual Style Guide & Asset Bible

## Branding

**Title:** VOID CASCADE  
**Tagline:** Shatter the void. Master the cascade.  
**Tone:** Cinematic deep-space intensity + pure addictive arcade skill.  
**Enemy faction:** Rift Stalkers (rebrand of classic Shenobi).

## Colour Palette (exact)

| Token            | Hex       | Usage |
|------------------|-----------|-------|
| void-black       | `#05010A` | Canvas clear, deep background |
| nebula-purple    | `#1A0A2E` | Soft volumetric clouds |
| neon-cyan        | `#00F5FF` | Player ship, thrusters, primary UI, bullets |
| electric-magenta | `#FF00AA` | Enemy energy, accents, secondary glow |
| plasma-blue      | `#3A7BFF` | Shields, secondary UI |
| hot-white        | `#FFFFFF` | Particle cores, impact flashes |
| ember-orange     | `#FF5E00` | Explosion secondary, debris |
| rock-grey        | `#2A2A3A` / `#4A4A5A` | Asteroid fill |
| crack-energy     | `#00FFCC` | Asteroid fissure glow |

**Glow rule:** Every interactive or dangerous element must have an additive/lighter composite glow. Background stays almost pure black so particles and neon pop.

## Typography
- Display / Logo: Orbitron (or any geometric futuristic sans) – weight 900, wide tracking
- UI: same family, weight 700 for buttons, 400 for body

## Ship Design (revised 2026-08-06)
- Proper interceptor, not a cursor: tapered fuselage with a vertical metallic
  gradient, swept wings with lit edges and wingtip lights, twin engine
  nozzles, glowing teardrop cockpit canopy
- Hull accents: neon-cyan edge light over dark steel
- **Thruster: rocket fire, not energy.** White-hot core → yellow → orange →
  red tail-off, both in the nozzle flame and the particle exhaust. (Supersedes
  the original cyan-thruster rule by explicit decision.)
- Optional skins: different accent colours for future unlocks

## Asteroids (revised 2026-08-06)
- Real rock, not neon wireframe: irregular 7–11 sided polygons, radial-gradient
  shading lit from upper-left, dark outline, per-asteroid craters with lit rims
- Asteroids are deliberately the one matte, non-glowing thing on screen — they
  must stay below the bloom threshold, which is what sells them as solid
- On destruction: layered fireball (white flash sparks, yellow core, orange
  body, lingering deep-red embers) plus matte grey rock shrapnel
- Large → 2 medium, medium → 2 small

## Shield (added 2026-08-06)
- Default key: Backspace (rebindable). Everyone starts each life with 60 shield
  (kid mode 100); pickups refill
- Drains ~20/sec while held; HUD bar labelled SHIELD shows remaining charge
- Ramming an asteroid with the shield up destroys it (full split, normal score)
  at a flat cost of 8 + 5×size shield

## Rift Stalkers (revised 2026-08-06)
- Curved manta silhouette with swept wings, wingtip barbs and a pulsing magenta
  rift core — deliberately a different species from the player's hard-angled
  cyan interceptor
- Tuned as pressure, not a swarm: slow turn/acceleration, long refire, short
  attack range; first appears wave 3, one at a time, capped at 3 per wave
- Magenta trails and bullets (enemy energy stays magenta — only the player's
  exhaust and rock explosions moved to the fire palette)

## Particle Systems (priority juice)
1. Thruster ribbons (continuous while thrusting)
2. Muzzle flash (small cyan burst on fire)
3. Asteroid death (dense cyan + orange)
4. Enemy death (magenta fireworks)
5. Shield impact (blue pulse)
6. Ambient background dust (very slow, low alpha)

All particles use additive blending (`globalCompositeOperation = 'lighter'`) for the premium glow look.

## Post-Processing

Implemented in `play/postfx.js` as a WebGL pass over the 2D game canvas. No
external dependencies; falls back to an unprocessed blit if WebGL is missing.

- Screen shake on every significant hit/destruction
- Hit-stop (brief simulation freeze) scaled to impact size
- Full-screen white flash (short, decaying) on big events, applied in-shader
- **Bloom** — soft-knee bright pass feeding a 6-level downsample/upsample mip
  pyramid. Two fixed-size gaussian octaves were tried first and reached only
  ~16px, which is invisible; each mip level doubles the reach, so the pyramid is
  what makes the glow read as light. `knee` must stay below `threshold`, or the
  bright pass never fully excludes anything and the near-black background leaks
  into the bloom and washes the whole image out.
- **Chromatic aberration** — radial, scales with distance from centre and with
  current screen shake
- **Vignette**
- **Tone mapping** — identity below `kneeStart` (0.9), soft exponential shoulder
  above it. Whole-range curves were tried and rejected: extended Reinhard
  measured 255 -> 172, dimming every pixel in the game by a third. Only bloom
  overshoot should ever be compressed.
- Still optional/future: subtle CRT scanlines toggle

Press **B** in game to toggle the whole chain for an A/B. All knobs live in the
`BLOOM` object in `index.html` and are exposed on `window`, so they can be tuned
live from the console (`BLOOM.intensity = 2.5`) without a reload.

**Particles:** one filled arc each, batched by colour. Do not re-add the old
core-plus-halo pair. The halo was faking a glow the bloom pass now produces for
real; drawing it again is both slower and worse looking.

## UI / Menus
- Minimal neon frames
- Large logo with animated gradient shimmer
- Home screen shows a TOP PILOTS leaderboard (top 5) directly under the logo
- Controls screen lists every action with two rebindable key slots; click a key
  chip, press the new key. Persisted in localStorage, reset button provided
- High-contrast buttons with hover glow
- High-score table clean and ranked
- Kid Mode toggle clearly visible

## Sound (implemented 2026-08-06 — fully procedural WebAudio, zero asset files)
- Thruster: looped low-passed noise, gain rides the thrust key (no clicks)
- Laser: short square-wave zap, 920→190Hz
- Asteroid crack: noise burst + sub-sine drop, scaled by rock size
- Enemy death: bandpass noise + falling sawtooth (metallic vs rock booms)
- Shield impact: bandpass blip; Pickup: two-note rising sine
- Player death: big low boom — but the FINAL death plays the game-over sting
  instead (falling minor motif G4–Eb4–C4–G3), never both
- Music: dark 4-bar synth loop (Am–F–C–G), bass pulse + sine arpeggio + soft
  tick, lookahead-scheduled; plays only during gameplay, fades on menu/pause
- M toggles all sound, persisted; audio starts on first click/keypress
  (browser gesture requirement) and every sound call is a safe no-op before that

## Modding
Keep the original Maelstrom-style folder structure for art/sound packs so future native ports remain drop-in compatible. The browser prototype is currently fully procedural (zero external assets) so it runs instantly.

---

This guide is the single source of truth for all future art, animation, and polish work.
