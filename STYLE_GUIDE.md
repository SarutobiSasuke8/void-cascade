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

## Ship Design
- Sleek angular interceptor silhouette (pointed nose, swept wings, central cockpit glow)
- Primary stroke: neon-cyan
- Fill: near-black with subtle cyan rim light
- Thruster: additive cyan + blue ribbon trails + occasional secondary particles
- Optional skins: different accent colours (magenta, gold, emerald) for future unlocks

## Asteroids
- Irregular 7–11 sided polygons with randomised radius variation
- Base fill dark grey, stroke energy cyan
- On destruction: dual particle burst (cyan shards + ember orange) + screen shake proportional to size
- Large → 2 medium, medium → 2 small

## Rift Stalkers
- More aggressive, slightly bulkier silhouette with magenta energy core
- Seek + fire behaviour (different patterns can be layered later: strafe, charge, shotgun)
- Magenta trails and bullets

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
- High-contrast buttons with hover glow
- High-score table clean and ranked
- Kid Mode toggle clearly visible

## Sound Direction (for future packs)
- Thruster: low resonant drone that rises with velocity
- Laser: short crystalline zap with slight pitch variation
- Asteroid crack: layered rock crunch + sub-bass hit
- Enemy engine: distorted aggressive hum
- Pickup: bright rising arpeggio
- Music: optional dark synthwave / ambient pulse that intensifies with wave number

## Modding
Keep the original Maelstrom-style folder structure for art/sound packs so future native ports remain drop-in compatible. The browser prototype is currently fully procedural (zero external assets) so it runs instantly.

---

This guide is the single source of truth for all future art, animation, and polish work.
