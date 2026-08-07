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

## Rift Tendril (added 2026-08-07)
- A bio-mechanical heavy rammer: long squid-like chitin hull, trailing limbs
  and one exposed electric-magenta core. It is a distinct unit, not a rename
  or variant of the Rift Stalker fighter.
- Enters from wave 5 at one per wave. Its presence caps Rift Stalkers at two,
  protecting the playfield from stacking too many active enemy threats.
- Behaviour: slow drift → bright core swell / locked heading → fast prow-first
  ram → recovery. It does not fire bullets; the core swell is the dodge tell.
- Starts at 5 hits and gains only one hit plus a small ram-speed step every five
  waves. A full-health Tendril survives one torpedo direct hit.

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
- Each stacks to ×3 and they combine freely. **×1 and ×2 persist until the ship is
  lost**; death resets all stacks (and the score multiplier)
- **×3 is OVERCHARGE and is temporary** (added 2026-08-07): it burns down to ×2 after
  14s, so peak power is a burst to chase rather than a state to sit in. Another pickup
  of the same type refreshes the full 14s rather than being wasted. The timer pauses
  during the wave tally
- Overcharged HUD entries switch from neon-cyan to gold (`#FFD23F`) at full opacity —
  the same reward token as the multiplier — with a glow and a depletion underline that
  drains left-to-right. The entry blinks over the last 3s, matching the multiplier's
  expiry language. Expiry plays a soft descending power-down, not a failure sting
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

## Hazards (added 2026-08-07)

Hazards are **terrain, not enemies**: they never block wave clear.

- **Drift mines (wave 4+, capped at 5, persist across waves):** matte dark sphere,
  magenta contact studs, idle breathing pulse. Proximity lights a one-way ~0.43s fuse:
  hard strobe + collapsing warning ring + two rising beeps. Blast (radius 130) deals a
  bullet-grade hit to rocks and a 35-shield / lethal hit to the player. Shooting one
  detonates it in place and pays 150×wave — sniping them is the counter-play. Nearby
  mines chain on a short sympathetic fuse, not instantly.
- **Gravity wells (wave 6+, 1–2 per wave, redealt each wave):** an absence, not a lamp —
  black core, thin bright event-horizon rim, nebula-purple halo, three plasma-blue
  accretion arcs, infalling spark trickle. No HP, no direct damage: pure inverse pull
  (zero at rim, strongest at core) on ship, bullets (hardest — curving shots are the
  point), torpedoes, rocks and pickups. Skipped on boss waves.

## Crystal Asteroids (added 2026-08-07)

The deliberate exception to "asteroids never glow": energy in mineral form. From wave 11
~22% of large rocks spawn crystal — translucent faceted shards, plasma-blue fill,
neon-cyan edge glow, inner facet lines. Always 1 hp (never armoured). A large crystal
skips the medium tier and **shatters into six fast small slivers** (mediums into three);
slivers die clean. Cold white/cyan/blue shatter burst — no embers — with a glassy
shatter cue instead of the rock boom. Scores 75×size×wave (riskier pays better).

## Boss: The Cascade Core (added 2026-08-07)

Every 10th wave, replacing the normal spawn table (4 rocks, no stalkers/tendril/wells).

- A slowly rotating armoured ring (radius 86, matte gunmetal like the rocks) around a
  breathing magenta rift core, with **four magenta weak-point nodes** (2 + tier hp,
  tier = wave/10). Plating is absolutely invulnerable — PIERCE does not go through —
  so the ring's rotation is the aiming puzzle. Torpedo hits land 2 damage on the
  nearest living node through the armour.
- Phases by surviving nodes: 4–3 spits medium rocks (crystal-capable from wave 20);
  at 2 it adds a 10-bullet radial ring with real gaps; at 1 it **charges across the
  field and re-enters through the screen wrap** — locked magenta bearing-line
  telegraph + klaxon first. Each node kill speeds the rotation.
- Death: staggered ring explosions marching around the hull, then the core lets go.
  Pays 10,000×tier plus three powerup drops. Node kills pay 1,000×tier.
- Music: the boss scene hard-cuts in (see Audio); toast announces THE CASCADE CORE.

## Ship Skins (added 2026-08-07)

The accent-colour system from the ship section, realised: ION cyan (default), AURORA
green `#00FF88`, SOLAR gold `#FFD23F`, VIOLET `#B44BFF`. **Magenta is deliberately
excluded — that is the enemy's colour.** A skin changes only the accents: sprite is
hue-rotated from cyan, procedural fallback strokes/wingtips/HUD life icons follow, and
the rescue starfighter matches. Hull steel, rocket-fire thruster, plasma-blue shield
and weapon colours stay canon. Picker: swatch row on the menu, persisted in
`localStorage.vc_skin`.

## Touch Controls (added 2026-08-07)

Coarse-pointer devices get a floating steer stick (left half) and FIRE / TORP / SHLD /
pause hold-buttons (right), all in the neon UI language at low alpha so the playfield
stays readable. Full mapping in `docs/INPUT_CONTROL_MAP.md`.

## Music Scenes (added 2026-08-07, revised same day)

Three scenes driven by game state: **menu**, **play**, **boss** (hard cut in — the cut
is the drama; everything else crossfades over 0.5s). During the wave tally and pause
the music ducks under a ~650Hz low-pass so stingers and tally ticks cut through.

The play scene **rotates a playlist** rather than layering stems (stems were built
first, then dropped when the soundtrack went to full tracks). Rotation advances every
`WAVES_PER_TRACK` (4) waves, landing on a wave boundary where the tally duck already
masks the change. Any file that fails to load falls back to the theme, so the game
still runs with one mp3.

Current soundtrack — all made by the project owner with SUNO:

| Slot | File | Notes |
|---|---|---|
| Menu | `void_cascade_theme.mp3` | Also first in the play rotation |
| Play 1 (waves 1–4, 13–16, …) | `void_cascade_theme.mp3` | |
| Play 2 (waves 5–8, 17–20, …) | `Hangar Full Burn.mp3` | |
| Play 3 (waves 9–12, 21–24, …) | `Maximum Thrust.mp3` | Guitar-led |
| Boss | `Turn to Face You (Boss Battle).mp3` | Hard cut on Core spawn |

Filenames contain spaces and brackets, so the loader `encodeURI`s them — keep that if
adding tracks. `TRACK_FILES`, `MENU_TRACK`, `PLAY_ORDER` and `WAVES_PER_TRACK` at the
top of the music block are the only things to edit when the playlist changes.

**Delivery rules (added 2026-08-07).** Music is by far the heaviest asset class, so:

- Encode at **VBR `-q:a 6`** (~125kbps), 44.1kHz stereo, and **strip cover art**
  (`-vn`) — SUNO exports ship an embedded mjpeg that costs real bytes. The set went
  27MB → 16MB with no change to duration or structure.
- **Only the menu track loads at startup.** Every other track is `preload="none"` and
  its `MediaElementSource` is created lazily by `warm()`, because connecting an
  element to the audio graph can start its fetch regardless of `preload`. Building
  all four sources in `init()` pulled the whole soundtrack on page load.
- Tracks are warmed **one step ahead**: the next rotation entry on every wave change,
  and the boss track from wave 8, so no scene change waits on a download.
- Adding a track means adding it to `TRACK_FILES` — the lazy path is automatic.

## Audio revisions (2026-08-07, later pass)

- **Thruster, second pass.** The first rebuild used saw partials through a Q=4.5
  resonant lowpass with a large pitch sweep — it sang like a synth lead and cut
  through everything. Now: triangles (octave, not fifth) through an almost-unresonant
  lowpass at 300→720Hz, a small 22% pitch rise, and a louder lowpassed air layer. The
  acceleration read comes from the filter opening, **not** from pitch. Rule going
  forward: the thruster is a bed, never a voice — it must never carry a discernible
  musical interval.
- **Asteroid boom.** Removed the scattered high-passed debris-crackle bursts and the
  bandpass body layer. With several rocks dying at once those piled into a constant
  hiss-and-click behind the explosions. One lowpass sweep plus the sub layers: the
  boom is **one sound, not two**.
- **Rift Tendril arrival cue** — a slow low swell with no attack in it, distinct from
  `bossAlarm` (which announces an imminent *move*, not a presence).

## Rift Tendril entrance (added 2026-08-07)

The Tendril no longer arrives mid-hunt. It spawns off-screen in an `enter` state:
creeping inward at 0.85px/frame, hull fading up over ~1.5s, **core held at 35%** so
the swell stays exclusively the attack tell. It cannot ram until it is properly
on-field *and* its entry timer has run — measured ~3s to arrive, ~6s to the first ram.
The entrance is the introduction; a heavy setpiece that spawns already charging reads
as a cheap shot.

## Modding
Keep a consistent folder structure for art/sound packs so future native ports stay drop-in compatible. The browser prototype is currently fully procedural (zero external assets) so it runs instantly.

---

This guide is the single source of truth for all future art, animation, and polish work.
