# Session Log — 2026-08-07 — Hazards, Boss, Skins, Touch, Music Scenes

**Agent:** Claude (Opus 5 / Fable 5)
**Scope:** One sweep of 17 user-approved items: thruster rework + overcharge (earlier
same-session), then quick fixes, HUD fit, drift mines, gravity wells, crystal
asteroids, the Cascade Core boss, music scene mixer, ship skins, touch controls, docs.

## ⚠ Concurrent editing

A second agent session (Rift Tendril work, see its own log) edited `play/index.html`
and `STYLE_GUIDE.md` **at the same time as this sweep**. Both change sets interleaved
cleanly — verified by a full lifecycle test after merge (wave 5 with a Tendril + my
hazards ran 300 mixed frames without error) — but future sessions should avoid two
agents in this file simultaneously; the Edit-anchor collisions were luck, not design.

## Changes (all in `play/index.html` unless noted)

1. **Thruster SFX** rebuilt as a pure-acceleration tone: two detuned saws + sine sub
   through a resonant lowpass; pitch and cutoff ride ship speed. Noise demoted to an
   air layer. No more flicker-LFO roar.
2. **Overcharge**: weapon stacks ×1/×2 persist; ×3 burns down to ×2 over
   `OVERCHARGE_TIME` (840 = 14s, dt-scaled, verified 60/90/144Hz within one frame).
   Same-type pickup refreshes. Gold HUD entry + depletion underline + last-3s blink;
   timers pause during wave tally; power-down cue on expiry.
3. **Pickups during invuln** fixed: collection loop moved above the invuln return
   (`collectPowerups()`).
4. **Rift Stalker & lost starfighter** now draw at the player's visual size
   (58×`SHIP_SCALE`); Stalker radius 16→22 (same forgiveness ratio), starfighter
   pickup radius 16→20.
5. **Pause** keeps the cockpit frame visible (`body.paused` lifts `#hudFrame` above a
   lightened pause veil; `setPauseScreen()` is the single owner of that state).
6. **HUD**: safe-area vars nudged inward; torpedo icons 18→24px with stronger glow,
   life ships 23→26px, shield bar 120×6→140×9 with border, labels 0.6→0.68rem.
7. **Drift mines** (wave 4+, cap 5, persist): proximity fuse 26 frames (one-way),
   blast 130 hits rocks/player/mines (sympathetic short fuse, no recursion), shootable
   for 150×wave, swept by torpedo blasts. Strobe + collapsing ring + beep tell.
8. **Gravity wells** (wave 6+, 1–2/wave, redealt per wave, none on boss waves):
   inverse pull on ship/bullets/torpedoes/rocks/pickups, bullets bent hardest; black
   core + accretion arcs + infalling sparks (pooled `emit()`, cap-respecting).
9. **Crystal asteroids** (wave 11+, ~22% of large spawns): 1hp faceted glowing
   shards; large→6 fast slivers, medium→3; glassy shatter cue; 75×size×wave.
10. **The Cascade Core** (every 10th wave): rotating armoured ring, 4 nodes (2+tier
    hp), absolute plating (no pierce), torpedo = 2 node damage; phases spit rocks →
    radial bullet ring → wrap-charge with locked-beam telegraph; staggered cascade
    death, 10,000×tier + 3 drops. Wave clear gated on boss death. Charge never ends
    off-screen (bug found in sim and fixed: charge extends until re-entry).
11. **Music scene mixer**: menu/play/boss scenes, optional stem layering
    (base/lead@4/tension@8), optional menu+boss tracks, everything falling back to
    the single theme; boss scene hard-cuts; drift-correction for stems; low-pass duck
    (650Hz) during tally and pause. Files documented in the code comment.
12. **Ship skins**: ION/AURORA/SOLAR/VIOLET accent swap (sprite hue-rotate,
    procedural accents, HUD life icons via CSS var, rescue starfighter matches);
    menu swatch picker; persisted `vc_skin`. Magenta excluded (enemy colour).
13. **Touch controls**: floating stick (left 52%, 12px steer / 26px thrust dead
    zones, angle-seek capped at keyboard turn rate) + FIRE/TORP/SHLD/pause buttons;
    OR-ed into the polled input model; shown on coarse pointers only.
14. **Docs**: `INPUT_CONTROL_MAP.md` touch section; `ASSET_PIPELINE.md` constants
    (native res capped 2.1MP, 1254×1254 masters); `CREDITS.md` theme = owner-made
    with SUNO; `STYLE_GUIDE.md` sections for every new system; `TODO.md` regroomed.

## Verification

- All new systems exercised headless via scripted sim in the browser pane (real DOM,
  real game code, synthetic frames): mine fuse/chain/detonation, well pull on
  bullets, crystal shatter chain, boss armour/nodes/phases/wrap-charge/death/restart,
  overcharge decay at 3 refresh rates, touch stick/buttons via synthetic TouchEvents,
  skin persistence + CSS application, music scene cycling with all optional files
  missing.
- Full lifecycle: start → wave-12 field with every system live → death → restart →
  menu. State resets confirmed (hazards, boss, weapons, overcharge).
- Frame-time smoke, 450 frames sim+draw on a 14-rock/3-enemy/3-mine/2-well field:
  **median 0.40ms, p95 1.10ms** (max 29.6ms one-off, likely GC/sprite decode).
- No JS console errors across the whole run. The only console noise is blocked
  loads of the five *optional* music files — by design until stems are dropped in.

## Not verified (open risks)

- **Nothing was played by a human.** Every tuning number (fuse, pull, node hp,
  telegraph, overcharge time) is on-paper. Playtest checklist run is the top TODO.
- **No audio monitoring and no pixel rendering** in the pane: sounds and visuals are
  structurally verified only. HUD nudge values especially need eyes.
- Touch tested with synthetic events only — real-hardware pass required.
- Boss + overcharged triple stack interaction untested at the feel level.

---

## Update — 2026-08-07 (later, feedback pass)

User feedback after the sweep. Seven items:

1. **Shield bar too low / overlapping the cockpit overlay.** Root cause was not the
   bar: the previous pass enlarged life icons to 26px, and 9 icons (9×26 + 8×4 = 266px)
   no longer fit the 20vw pod, so the row **wrapped** and pushed everything below it
   down. Verified by arithmetic across widths — it wrapped at *every* desktop width
   below 1440px. Fixed by widening the pod to `min(24vw, 340px)` and sizing icons with
   `clamp(14px, 2.2vw, 26px)` / `clamp(13px, 2.05vw, 24px)` so a full rack of 9 fits
   one row at 900–2560px, plus tightened right-column gaps/margins. Icons stay at the
   intended larger size on normal screens — the fix widens rather than shrinking back.
2. **Rift Tendril entrance.** New `enter` state: off-screen creep at 0.85px/frame,
   hull alpha fading up over ~1.5s, core dimmed to 35%, no ram possible until on-field
   and the timer expires. Measured 3.0s to arrive, 6.0s to first ram (was ramming
   almost immediately). Added `tendrilArrive()` — a slow low swell, no attack in it.
3. **Sprite tracking.** New `docs/SPRITE_STATUS.md` — every sprite with done/needed/
   deliberately-procedural status, sizes, authoring notes and a priority order.
   Referenced from `CLAUDE.md` (docs table + verification table).
4. **Thruster, second pass.** The first rebuild was too penetrating — saws through a
   Q=4.5 resonant filter with a large pitch sweep read as a synth lead. Now triangles
   (octave partial, not a fifth) through an almost-flat lowpass, 300→720Hz sweep, and
   pitch rise cut from 85% to 22%; air layer raised to carry more of the sound.
5. **Asteroid boom secondary noise removed.** Deleted the 2+size scattered high-passed
   crackle bursts and the bandpass body layer — with several rocks dying together they
   stacked into a continuous hiss/click. Left `enemyBoom` alone (one at a time, not a
   pile-up).
6. Suno prompt for the second track delivered in chat (boss theme).

### Verification
- Tendril entry timing measured in-sim; confirmed it never enters `windup`/`charge`
  during `enter`; `drawEnemies` exercised mid-fade.
- HUD fix verified by layout arithmetic at 900/1100/1280/1440/1920/2560px (old code
  wrapped below 1440, new code fits at all six). **Not verified on a real rendered
  screen** — the preview pane reports a 0px viewport, so `vw` units collapse there.
- Audio calls exercised without exception; **not heard** — no audio monitoring.

### Residual risk
The HUD fix is arithmetic-correct but unseen. If the shield bar is still off, the
next thing to check is the cockpit art's actual pod bounds, which no doc records —
worth measuring once and writing into `STYLE_GUIDE.md`.

---

## Update — 2026-08-07 (soundtrack wired)

User supplied three SUNO tracks alongside the original theme. None matched the
filenames the mixer was looking for, so the game was still playing only the theme
until this change.

**Stems removed, playlist rotation added.** The stem-layering machinery (base/lead/
tension with shared-clock drift correction) was written speculatively and never had
files; with the soundtrack going to full tracks it was dead weight, so it was replaced
by a rotating play scene. `TRACK_FILES` / `MENU_TRACK` / `PLAY_ORDER` /
`WAVES_PER_TRACK` are now the whole config surface.

Assignment (per user answer — "Hangar Full Burn" is a gameplay track, not the menu):

- menu → `void_cascade_theme.mp3`
- play → rotates every 4 waves: theme → `Hangar Full Burn` → `Maximum Thrust`
- boss → `Turn to Face You (Boss Battle)`

Filenames carry spaces and brackets, so the loader `encodeURI`s the path.

### Verification
- All four files probed by URL: 200 OK with metadata — theme 207s, Hangar Full Burn
  323s, Maximum Thrust 307s, Boss 320s.
- Rotation mapping asserted waves 1–16 (4 waves per track, wrapping correctly).
- 22 waves of `setPlayWave`/`setScene`/`duckMusic` including boss waves, plus
  `restartMusic`/`ensureMusic`, with no exceptions.
- **Not heard.** No audio monitoring here — crossfade quality, level matching between
  tracks and the boss hard cut are all unverified by ear.

### Flagged
The four mp3s total **~28MB** at ~200kbps. That is the entire download budget for a
browser game and will hurt first load on GitHub Pages. Logged in `TODO.md`:
re-encode ~128kbps and/or trim to 2–3 min loop edits.

---

## Update — 2026-08-07 (soundtrack re-encode + lazy loading)

**Re-encode.** ffmpeg (winget build, on PATH). Compared CBR 128k against VBR
`-q:a 5/6/7` on one track: q6 came out both smaller *and* higher quality per bit than
CBR 128k, so all four were encoded at **VBR q6, 44.1kHz stereo, `-vn`**. The `-vn`
matters — every SUNO export carried an embedded mjpeg cover.

| File | Before | After |
|---|---|---|
| Hangar Full Burn | 7906KB | 4952KB |
| Maximum Thrust | 7282KB | 4558KB |
| Turn to Face You (Boss Battle) | 7779KB | 4797KB |
| void_cascade_theme | 4734KB | 2848KB |
| **Total** | **27MB** | **16MB** |

Durations preserved to the millisecond; all four re-decode clean through ffmpeg.
**Originals backed up outside the repo** at
`…/Temp/claude/<session>/scratchpad/audio-originals/` — that is a temp directory, so
copy them somewhere permanent if the encodes turn out to be audibly worse.

**Lazy loading — the bigger win.** All four elements were `preload="auto"`, so the
browser pulled the entire soundtrack at page load. Now only `MENU_TRACK` loads up
front. Two changes were needed, not one:

1. `preload="none"` on every non-menu track.
2. **`MediaElementSource` creation moved out of `init()` into `warm()`.** This was the
   real bug in the first attempt — `init()` built a source for all four tracks at page
   load, and connecting an element to the audio graph can start its fetch regardless
   of `preload`, which silently defeated the lazy loading.

`warm()` is idempotent, safe before the context exists, and is called from
`applyScene`/`ensurePlaying` plus one step ahead of need: the next rotation entry on
each wave change, and the boss track from wave 8.

### Verification
- Encoded output: sizes and durations above; full decode with no errors.
- 22 waves of scene/rotation/duck calls including boss scenes, plus restart, mute
  toggle and music off/on — no exceptions with lazy sources.
- Full lifecycle regression after the audio-init restructure: wave-12 field, 300
  frames sim+draw **median 0.30ms / p95 0.90ms**, death → restart → menu all correct.
- **Could not cleanly measure on-load fetch count.** The pane's network log is
  cumulative across reloads and `performance.getEntriesByType('resource')` does not
  record `file://` media, so the "only one track loads" claim rests on the code path,
  not on a measurement. Worth confirming once in a real browser devtools Network tab.
- **Still not heard.** No audio monitoring — transcode quality unverified by ear.

---

## Update — 2026-08-07 (playtest feedback: boss was unkillable)

User played the build. Verdict: "genuinely really fun", but the wave-10 boss was
**invincible**.

### The bug, and why my earlier test missed it

Nodes orbited at `NODE_DIST = 62`; player bullets were absorbed by armour as soon as
they came within `BOSS_RADIUS + 4 = 90` of the centre. A bullet was therefore destroyed
**28px before it could ever touch a node**. The boss could not be damaged by gunfire at
all — only by torpedoes, which damage the nearest node through the armour. That is why
it read as invincible rather than merely hard.

My original verification created bullets **at the node coordinates with zero velocity**
and called `checkCollisions()`. That never crossed the absorb radius, so it tested the
node-damage branch in isolation and reported a pass. The lesson for this file: collision
tests must fire projectiles **from outside, with real velocity, stepped through
`updateBullets()`** — placing an object at its destination tests nothing about whether
it can get there.

Fix: nodes moved onto the rim (`NODE_DIST = 80`, `NODE_R = 15`, so
`NODE_DIST + NODE_R > BOSS_RADIUS`), and node hits are tested *before* the armour
check. Re-verified with real inbound bullets: aimed shot damages a node, a shot into
the 45° gap is absorbed with no node damage, and the boss dies to 12 aimed shots.

### Also in this pass
- **Boss health bar** — DOM, magenta, with one pip per node; hides via `hideTally()`
  so it cannot freeze over the game-over screen.
- **Escalating adds** — phase 0 (on waking) 3 Stalkers, phase 1 (below 2/3 hp) 2
  Tendrils, phase 2 (below 1/3 hp) 2 Stalkers + 2 Tendrils. Verified: 5 Stalkers and
  4 Tendrils by the end, staggered.
- **Grid removed** from `drawBackground` by explicit request.
- **Nebula palette follows the music** (violet/blue/teal/magenta), eased over ~2s.
- **Music picker** on the menu: AUTO or a forced track, persisted; boss always wins.
- **Pause keeps the HUD** as well as the cockpit above the veil.
- **Menu overlap fixed at the class level.** Measured the reported collision (skin row
  738–760 vs pause hint 752–766 = 14px overlap at 790x790). Rather than nudging, the
  two hints were moved from absolute positioning into normal flow, and screens now
  scroll instead of clipping — at 1280x620 the menu logo had been clipped to −83px.
  Verified no overlaps and no clipping at 790x790, 1280x620 and 1920x1080.

### Verification
- 21 waves including two full boss fights, full sim + draw: no exceptions.
- Pause layering asserted (HUD and cockpit both z-index 12, cleared on resume).
- Grid confirmed absent from the compiled `drawBackground`.
- Death → restart → menu clean.

### ⚠ Performance is NOT measured, and earlier figures were misleading
Previous logs in this file quote figures like "median 0.30ms, p95 0.60ms". Those loops
**did not call `drawBackground()`**, which the real frame loop calls every frame, so
they understated true cost. Attempts to measure properly here failed: the preview pane
is hidden, so nothing composites, `requestAnimationFrame` never fires, and a tight
synchronous draw loop produced nonsense (max 1748ms). **Treat every frame-time number
in this log as unverified.** The boss fight with 9 adds is the heaviest scene the game
has ever had; it needs a real playtest, and if it stutters the phase-2 adds are the
first thing to cut.

---

## Update — 2026-08-07 (boss art wired, third HUD-overlap fix)

Playtest feedback session. Codex had concurrently added enemy tiers, three asteroid
variants, drift mine / torpedo / multiplier / boss-background art, and a four-image
Cascade Core set.

### Merged-state verification (Codex tiers + this session's boss work)
Ran both change sets together before touching anything: 22 waves incl. two boss
fights, tier-tuned enemies, hazards, real inbound-projectile collision, pause
layering, nebula mood, death/restart. No exceptions, no regressions.
`enemyTierForWave()` gates correctly at 11/21 and my node-reachability fix survived.

### Boss art — hybrid render (option A)
The Codex art is **four whole-creature portraits at damage tiers**, not modular
parts. A portrait cannot express an arbitrary live/dead node combination, so it
cannot drive the mechanic on its own. Resolution: portrait supplies the body and
baked tendrils (swapped at 75/50/25% total HP); the four functional node pips render
**on top** at their exact rotated positions. Procedural path retained as fallback.

**`NODE_DIST`/`NODE_R` are now MEASURED FROM THE ART, not designed.** Sampled the
sprite with `getImageData`: the baked diamonds sit at exactly 0/90/180/270° at radius
~64px, each with a ~26px glow footprint. Set `NODE_DIST = 64`, `NODE_R = 26` (was
80/15). If the art is replaced, re-measure both — otherwise pips drift off the
diamonds and a dead node leaks glow around its cover.

Node reachability is now guaranteed by **check order** in `checkCollisions` (node-hit
tested before the armour-absorb radius), not by keeping `NODE_DIST` outside
`BOSS_RADIUS`. `BOSS_RADIUS` is now only the procedural fallback's ring radius.

Later reduced the *visible* pip 30% via a new `NODE_VIS_R = NODE_R * 0.7`, used only
for the two drawn shapes. `NODE_R` still drives the hit-test **and** the opaque cover
circle, so the smaller glow did not shrink the target or reopen the cover leak.

### A false alarm worth recording
An early "art leaking through the dead-node cover" result was **my test being wrong**:
a 30px *square* sample grid has corners at ~42px, reaching outside the circular
~29px cover and picking up nearby tendril colour. Restricting the search to the actual
cover radius showed a clean 723 (alive centre) vs 277 (dead, at the very edge).
Sample within the shape you are actually testing.

### Boss health bar — third and final overlap fix
Two earlier attempts each looked right at one viewport and broke at others:
`top: 10%` overlapped the wave/torpedo/shield row by 14–23px; a `--hud-safe-y` rem
offset still overlapped by 17px once weapon chips and the overcharge underline
stacked to their tallest. Measuring vertically fixed that but pushed the bar into the
playfield.

Final form: the bar sits **in the measured gap between the two HUD pods**, inside the
cockpit instrument band. Both axes come from `getBoundingClientRect()` on the pods —
vertical centring in the pod band, width = pod gap − 18px gutter each side, with a
50%-viewport fallback if the gap drops under 120px. The **title was removed**: at
720px natural width it was the only element too wide for the 486px gap, and
`spawnBoss()` already toasts the name, so a permanent label repeated a one-time event.

Verified with worst-case HUD content at 1920×1080 (bar 954px), 1280×800 (450px) and
560×760 (177px) — 18px clearance both sides at every size.

**Lesson, now three times over:** static CSS values against content-dependent geometry
fail. The HUD's height and width vary with viewport, wrapped icon rows, and 0–3 weapon
chips. Measure, never guess.

### Also
- Grid removal, nebula-follows-music, music picker and pause-keeps-HUD all confirmed
  still working post-merge.
- `SPRITE_STATUS.md` boss section rewritten to describe the hybrid and to mark the
  modular ring/core/node pieces as **dropped, do not generate**. Priority list cleared
  — no art gaps remain; medium/small asteroid tiers and optional UI art are all that
  is left.

### Still not verified
Performance remains **unmeasured** — the preview pane does not composite, so rAF never
fires and synchronous draw loops give nonsense. The wave-10 fight with up to 9 adds
plus a 300px boss portrait is the heaviest scene in the game and needs a real
playtest. Audio still unheard.
