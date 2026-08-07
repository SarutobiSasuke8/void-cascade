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

### Armoured rocks (added 2026-08-07)
Late-wave difficulty comes from **tougher rocks, not more rocks**. The large-asteroid
count plateaus at 14 (reached ~wave 6); past that `armorFor()` hardens them:
large 1→4 hits, medium 1→2 hits, small always one-shot. Kid Mode never gets armour.

- Armoured rocks show **crack-energy `#00FFCC` fissures** — faint (0.16 alpha) while
  intact so the armour is telegraphed before you shoot, blazing (0.86) when nearly
  broken. The rock **body** stays matte and below the bloom threshold; only the
  fissures glow, so asteroids keep their solid read
- A non-lethal hit gives a white flash, teal chips and a metallic *clank* (deliberately
  unlike the rock-shatter boom) so you can hear the rock survived
- Chip damage still scores (15×wave) so shooting armour never feels inert
- Shield-ramming and torpedo direct hits ignore armour entirely; the torpedo blast wave
  deals 2 damage

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

Particles are **pooled and budgeted** (added 2026-08-07). One large asteroid's full
split chain emits ~870 particles, so eight rocks dying together produced ~7,000 in a
single frame — 15ms of draw plus heavy GC churn, which is what made late waves stutter.
Objects come from a free list, dead ones are swap-removed (O(1), not `splice`), and
bursts thin proportionally above 1,400 particles with a hard ceiling of 2,400.
A *single* explosion is never thinned — only overlapping ones.

Do **not** batch the per-particle `fill()` calls into one path per colour. It is
tempting and much faster, but under `lighter` compositing it makes overlapping
same-colour particles fill as a union instead of accumulating brightness, which flattens
the blown-out core of every explosion.

## Weapon Power-ups (added 2026-08-07)
- Three weapon buffs, all dropped by asteroids: **RAPID** (refire delay ×0.62 per
  stack), **SPREAD** (3 / 5 / 7-bullet fan), **PIERCE** (bullets survive 1–3 impacts)
- Each stacks to ×3, they combine freely, and the whole loadout **persists until the
  ship is lost** — death resets all stacks (and the score multiplier)
- Piercing bullets render plasma-blue (`#3A7BFF`) so the buff is visible in flight;
  everything else the player fires stays neon-cyan
- SPREAD/PIERCE pickups use generated dark-gunmetal modules with large readable
  weapon glyphs; the procedural ring + glyph renderers remain as load fallbacks

## Score Events (added 2026-08-07)
- **Multiplier stars**: gold (`#FFD23F`) spinning four-point star, spawns at a random
  edge every ~10–20s, drifts across the field. Each pickup = +1 multiplier (max ×5),
  12s timer refreshed on pickup, lost on death. Shown gold next to the HUD score,
  blinking when about to expire
- **Extra ships** are a milestone, not an income stream: first at 50,000 points, each
  one after costing 60% more (50k → 130k → 258k → 463k …). **Lives cap at 9**
- **Lost starfighter**: rare (~80–140s) drifting, spinning player ship with a pulsing
  cyan distress ring — collecting it is +1 ship. It does not spawn at the life cap, and
  a rescue collected at the cap pays 5,000 points instead of a tenth ship
- **Wave tally**: on wave clear, "WAVE n CLEAR / BONUS +x" counts a 250×wave bonus up
  with ticks; the field stays playable and the next wave arrives ~3.4s later
- Torpedo direct hits **vaporise** the whole rock (no children, ~full-chain score) and
  blast-split every rock within 110px

## Cockpit Frame (added 2026-08-07)
- Generated sci-fi cockpit overlay: dark-gunmetal perimeter rails with restrained
  cyan edge lights and an intentionally open central canopy
- Dedicated recessed instrument pods integrate the DOM HUD: score, wave, and weapon
  stacks on the left; lives, torpedoes, and shield on the right
- `pointer-events: none`; the frame stays at the perimeter and is more than 74%
  transparent, while the DOM HUD renders above it for crisp, unobstructed readings
- Ship renders at 1.18× visual scale; the collision radius stays 14 (forgiving
  hitbox, never a lying one)

## In-World Text Rule (added 2026-08-07)

**Readable UI text belongs in the DOM, not on the game canvas.** The wave tally and the
reward toasts were first drawn to the canvas so they would bloom, and they became an
illegible smear. Pixel probes: a dark outline plus a pulled-back fill only moved the
fully-saturated pixel count from 13.4% to 12.3%, because the bloom pass re-blows out
anything above its 0.40 threshold no matter what colour it started as.

Both now render as DOM overlays that sit *after* postfx, with a controlled CSS
`text-shadow` glow instead of an uncontrolled bloom. They also cost nothing per frame.

Canvas is for the world; DOM is for words the player must read. The HUD already followed
this rule — the exception was the mistake.

## UI / Menus
- Minimal neon frames
- Large logo with animated gradient shimmer
- Home screen shows a TOP PILOTS leaderboard (top 5) directly under the logo
- Controls screen lists every action with two rebindable key slots; click a key
  chip, press the new key. Persisted in localStorage, reset button provided
- High-contrast buttons with hover glow
- High-score table clean and ranked
- Kid Mode toggle clearly visible

## Sound (implemented 2026-08-06 — fully procedural WebAudio, zero asset files; explosion chain upgraded 2026-08-07)
- **Thruster (rebuilt 2026-08-07):** a rocket roar, not a hum. One looped noise source
  feeds a low-pass body (260Hz) and a bandpass air-hiss (950Hz), plus a 46Hz sawtooth
  sub for the chest thump, with a 7.5Hz LFO flickering the hiss so the burn never sits
  as flat static. Fast attack / slower release. The hiss and sub thicken with ship
  speed, and a light reverb send puts the burn in the same space as the explosions
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
- **Explosion bus (2026-08-07):** big impacts (asteroid/enemy/torpedo/player booms)
  route through a shared bus — tanh soft-clip drive, screen-position stereo pan
  (clamped ±0.7), and a send into a **procedurally generated reverb** (1.1s decaying
  stereo-noise impulse response). Each boom adds a 45–60Hz sub-sine layer and
  randomised high-frequency debris crackle. A DynamicsCompressor on the master bus
  keeps overlapping explosions loud instead of clipping
- New cues: tally tick (counting), extra-ship arpeggio (C5-E5-G5-C6), multiplier
  chime + shimmer
- Menu music: the theme now attempts autoplay at page load and starts on the first
  click/keypress otherwise; a pulsing "CLICK OR PRESS ANY KEY FOR SOUND" hint shows
  on the home screen until audio is actually running

## Modding
Keep a consistent folder structure for art/sound packs so future native ports stay drop-in compatible. The browser prototype is currently fully procedural (zero external assets) so it runs instantly.

---

This guide is the single source of truth for all future art, animation, and polish work.
