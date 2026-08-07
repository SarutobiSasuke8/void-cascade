---
title: Session Log - Wave-26 feedback difficulty tuning
date: 2026-08-07
status: complete
type: session-log
mutability: append-only
project: void-cascade
agent: Claude Code (Fable 5)
tags:
  - session-log
---

# Session Log - Wave-26 feedback difficulty tuning

## Executive Summary

First real long-run playtest feedback (owner reached ~wave 26, ~3M points) landed one
core finding: **a full weapon loadout turns waves 11+ into a victory lap**. This session
converted that feedback into four surgical balance/readability changes — a ×2 weapon-tier
decay, a lives cap cut, larger glowing mines, and legible enemy-tier badges — plus TODO
design directions for a dedicated wave-20 boss and further escalation levers.

## Trigger

Owner playtest report, 2026-08-07: reached wave 26 / 3M points; wave 20 reuses the
wave-10 boss; lives cap too generous; waves 11+ easy when well-armed; mines too small;
enemy tiers visually unreadable; "polygonal asteroids" look unfinished; proposed a
"slower ×2 decay" as the fix for the difficulty sag.

## Starting State

- `main` at `b07ddab`, clean. All sprite art from the 2026-08-07 pass wired.
- Weapon stacks: ×1 and ×2 permanent per life, ×3 OVERCHARGE timed (840 ticks).
- MAX_LIVES 9; extra ships at 50k × 1.6^n; mines radius 11, no halo; enemy tiers
  (11+/21+) existed mechanically but were marked only by a ~5px core tint.

## Work Completed

- **×2 weapon decay** (`TIER2_TIME = 1800`, 30s at 60Hz, dt-scaled): the ×2 tier now
  burns down to ×1 unless refreshed by re-pickup. Overcharge expiry re-seeds a fresh
  ×2 clock. ×1 remains permanent. Kid Mode never decays (timer is never set). Burn is
  paused during the wave tally, same as overcharge. Interpreted the owner's "slower ×2
  decay" as the *weapon* tier, not the score multiplier — it is the reading that matches
  "if you are well armed waves 11+ are surprisingly easy".
- **HUD**: the overcharge depletion underline is generalised — cyan bar + expiry blink
  for a decaying ×2, gold stays reserved for OVERCHARGE. Toast on expiry: "RAPID FADED ×1".
- **MAX_LIVES 9 → 5**: at 3M points the old cap allowed ~7 banked extra ships, which
  deleted death pressure. Threshold-advance-while-capped behaviour unchanged.
- **Mines**: radius 11 → 14 (~27% bigger on screen, also slightly easier to snipe,
  which is intended), plus an additive magenta halo — breathing idle, strobing when
  armed — kept low-alpha so the void stays near-black. Core dot 3.2 → 4.
- **Enemy tier readability**: Rift Stalker tier 2/3 now carry a real magenta aura
  (13–28px, pulsing) and tail rank chevrons (tier 2 = one, tier 3 = two), on both the
  sprite and procedural fallback paths. Tendril already had core-scale + hot seams;
  left as is.
- **TODO**: added the dedicated wave-20 boss direction ("Rift Matriarch" sketch),
  an escalation-levers list, the kill-refreshed score-multiplier idea, the
  polygonal-asteroid identification task; removed the stale asteroid-variants line
  (that art shipped per `docs/SPRITE_STATUS.md`).
- Added `.claude/launch.json` so agent sessions can attach the browser pane to
  `preview-server.js` (port 4173) without guessing.

## Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| "×2 decay" = weapon tier, not score multiplier | Matches "well-armed waves 11+ are easy"; score mult already fully decays in 12s | Owner playtest disagrees with the reading |
| TIER2_TIME = 30s | Slower than overcharge (14s) by ~2×; long enough to not nag, short enough to matter across a 40s wave | First feel pass — tuned on paper |
| MAX_LIVES = 5 | ~7 banked ships by 3M pts removed all death pressure | If mid-game (waves 8–15) starts feeling starved |
| Lives cap chosen without asking owner for the number | Reversible one-constant change; 5 keeps one HUD row and real pressure | Owner prefers a different number |
| Tier badge = aura + chevrons, procedural | Reads at combat distance; no new art dependency; hue-rotate filter on drawImage rejected (slow path) | If Codex ever draws per-tier skins |
| Wave-20 boss NOT built this session | Needs design + art + music, not a quick fix | Next art/design session |

## Files Touched

| File | Change |
|---|---|
| `play/index.html` | TIER2_TIME const; `player.tier2` state + resets; pickup/overcharge-expiry seeding; tier-2 burn in `updateOvercharge()`; generalized HUD underline (+ CSS `.wpn.t2`); MAX_LIVES 5; mine radius 14 + halo; stalker tier aura/chevrons both render paths |
| `TODO.md` | New playtest + design items (see Work Completed); stale asteroid-art line removed |
| `.claude/launch.json` | Preview-server launch config (new) |
| `Session Logs/_Session Logs Index.md` | This log's entry |

## Verification

Per `CLAUDE.md` policy. The browser pane could not composite this session (known
limitation, already noted in TODO for the boss frame-rate item), so no screenshots —
logic was verified by calling game functions directly in the live page:

- Page loads via `preview-server.js`; **zero console errors** at menu.
- ×2 decay: forced `weapons.rapid=2, tier2.rapid=2`, stepped `updateOvercharge()` →
  drops to ×1, timer zeroed, toast fired → **pass**.
- Overcharge expiry: `weapons.spread=3, overcharge.spread=1` → one tick → ×2 with
  tier2 = 1799 (fresh 1800 minus the same frame's burn — correct) → **pass**.
- Lives cap: `lives=5`, crossed a 50k threshold → lives stay 5, `nextLifeScore`
  advanced to 130k → **pass**.
- HUD: forced a half-spent ×2 → `.wpn.t2` span renders with `scaleX(0.5)` cyan bar → **pass**.
- Draw paths: idle + armed mines (radius 14, halo) and a tier-3 stalker drawn through
  `drawMines()`/`drawEnemies()` with no exceptions → **pass**.
- Kid Mode: ×2 with no timer set does not decay → **pass**.
- Frame-rate independence: both burns are `dt`-scaled identically to the existing
  overcharge burn (no new per-frame counters), so 60/144Hz behaviour is equivalent by
  construction.
- **Not verified (needs human eyes/hands):** the *feel* of the 30s decay, mine halo
  brightness against the void (pixel-probe if in doubt: background must stay `#05010A`),
  chevron legibility at speed. Playtest item added to TODO.
- Playtest checklist verdict: **not run** (no compositing preview this session) — the
  standing TODO item to run it against the current build now also covers this pass.

## Open Threads

| Thread | Next Step |
|---|---|
| Feel-tune TIER2_TIME / lives cap | Owner playtest, then adjust constants |
| Wave-20 dedicated boss | Design pass on the Matriarch sketch in TODO |
| "Polygonal asteroids" | Owner confirms crystals vs grey rocks (TODO item has the fork) |
| Escalation levers (drop-rate scaling, wave modifiers, tier 4, aimed fire) | Pick one per session, not all at once |

## What Worked

- Feedback triage into "constant-turn quick fixes now, design work queued" kept the
  change surgical while still moving the difficulty needle in one session.
- Driving the live page's own functions through the console verified real logic paths
  without a compositing preview — much stronger than a code-read, per the "passing test
  can hide the bug" theme.

## What To Do Differently

- Balance changes stack: ×2 decay AND a lives cap cut in one pass could overshoot into
  frustration. They were kept in one session deliberately (same feedback batch), but the
  next playtest should judge them *together* before any further difficulty lever is pulled.

## Connected

- `2026-08-07-session-log-cascade-core-tendrils.md` — introduced the enemy tier tables
  this session made visible.
- `2026-08-07-session-log-hazards-boss-skins-touch.md` — introduced OVERCHARGE, whose
  timer language the ×2 decay now extends; and the mines this session enlarged.

---

## Update — 2026-08-07 (same session, follow-up)

Owner asked about the Tendril's tier marks: the first pass upgraded only the Stalker
and left the Tendril's old hot seams (~0.3 alpha) as-is. Extended the same rank
language to it: seams brightened (alpha 0.38 + 0.10/tier, width 1.1 → 1.4) and the
tail now carries the same rank chevrons as the Stalker (tier 2 = one, tier 3 = two),
scaled to the Tendril's larger hull. Deliberately hull marks, not glow — the core
swell must stay exclusively the ram tell. Drawn inside the existing entry-fade block,
so an arriving Tendril's chevrons fade up with the hull; covers sprite and fallback
paths (the marks are drawn after the branch, shared by both).

Verification: page reloaded via the preview server; drew tier-2 and tier-3 Tendrils
plus a tier-3 Stalker through the real `drawEnemies()` — no exceptions, no console
errors. The pane still cannot composite, so legibility at combat distance remains
part of the standing playtest item in `TODO.md`.

---

## Update — 2026-08-07 (same session, second follow-up): Void Crystals → Void Iron

### Trigger

Owner on the crystals: *"These dont seem particularly harder or cool looking they seem
out of place. I would rather a tiered up harder to destroy asteroid with a different
sprite for clarity."*

### Diagnosis

The crystals had **1 hp**. They were the loudest object in the field — the deliberate
documented exception to "asteroids never glow" — and simultaneously the easiest thing
on screen to kill. The look promised a threat the mechanic never delivered, so the eye
filed them as decoration. That mismatch, not the shard art, is why they read as out of
place. Worth keeping as a rule: **in this game visual loudness is a promise about
difficulty, and breaking that promise is what makes an object feel fake.**

A second, related clarity gap was already latent: `armorFor()` has made large rocks
1–4 hits since 2026-08-07, but an armoured rock looks identical to a soft one apart
from faint fissures. Difficulty existed without being legible.

### Work Completed

Replaced the species outright with **VOID IRON**, a heavy plated rock in the same
spawn slot. Full spec now in `STYLE_GUIDE.md`; the shape of it:

- **Large tier only** (`heavy && size === 3`). Heavy children would make one rock a
  six-stage slog — the "spongy" failure the armour system exists to prevent. The shell
  is the event; what spills out is 2 ordinary mediums, so the entity budget is
  unchanged from any other large rock.
- 5–8 hits via `heavyArmorFor()` (steps every 4 waves from 11); Kid Mode 2. Radius 48,
  0.62× drift speed, slow tumble — the silhouette gets time to register.
- Blockier geometry (`generateHeavyVerts()`: 8 verts, 0.92–1.02 radius spread) plus
  procedural gunmetal plating (`generatePlates()` / `drawPlates()`) with bolt heads,
  and crack-energy `#00FFCC` burning in the plate seams, scaling 0.14 → 0.86 with damage.
- Sprite slot `assets/asteroids/large/void_iron_01.png` wired with automatic fallback:
  no master → standard rock master + procedural plating; master present → baked art and
  the plating overlay switches itself off. Full art brief added to `docs/SPRITE_STATUS.md`.
- Death is metal failing, not stone breaking: vented teal seam energy + plate shrapnel
  over the normal fireball, with `AudioFX.shatter` (the old crystal cue, repurposed and
  recommented rather than left dead) layered on the rock boom.
- Scores 130×size×wave and drops a powerup at **65%** vs a normal rock's 12%
  (`maybeDropPowerup` gained an optional `chance` arg). This is deliberate economy
  design against the same session's ×2 weapon decay: the hulk is the field's resupply,
  making it a genuine risk/reward choice rather than an obstacle to route around.
- Boss spit reverted to plain mediums (was crystal-capable from wave 20) — Void Iron is
  large-tier, and the boss scene is already the heaviest in the game.

### Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| Remove crystals rather than re-skin | The 1 hp *was* the problem; new art on a one-shot rock repeats the lie | A glowing species returns that is genuinely harder than rock |
| Large tier only | Avoids the sponge cascade and needs one sprite, not three | Play says the field wants a heavy medium |
| Shield ram chips 2 + bounces instead of destroying | A shield ram deleting an 8-hit hulk for 23 charge hands the player a free answer to the one rock built to be work | Ramming feels inert |
| Torpedo still vaporises it | Torpedoes are scarce (3–9); spending one to delete a hulk is a real tactical choice, not an exploit | — |
| 65% drop rate | Pairs with the ×2 decay: cracking the hulk is how you refuel | Loadouts feel too easy to maintain |

### Verification

Pixel probes were finally possible this session. The Browser pane still cannot
composite — which is *why* the earlier probes returned zeros: **the game had sized its
canvas to 1×1** because the pane has no layout size. Sizing the offscreen canvas to
800×600 by hand and driving the real `drawAsteroids()` measures the rendering code
directly, independent of compositing. Worth reusing; it unblocks the whole "measure,
do not eyeball" policy in this environment.

Body brightness, max-channel metric matching `postfx.js`'s prefilter (threshold 0.40):

| Sample | Max channel | % of body over bloom threshold |
|---|---|---|
| Shipped rock, wave 20 | 0.82 | 21.3% |
| Void Iron, intact | 0.71 | **4.6%** |
| Void Iron, half hp | 1.00 | 16.6% |
| Void Iron, nearly broken | 1.00 | 22.9% |

So the intact hulk is markedly **more** matte than a shipped rock — it is the darkest
object in the field — and it lights up as it breaks. That is exactly the intended read.
Background 20px from the rock measured exactly `[5,1,10]` = `#05010A`. The steel top
stop was moved `#525A6B` → `#4E5464` mid-session precisely because the probe put the
original at max channel 0.42, over the 0.40 threshold; bolt heads were dimmed for the
same reason. **Eyeballing would have shipped a blooming rock.**

Logic, driven through the real functions on the live page:

- Armour curve 5/5/6/7/8 at waves 11/14/18/22/26; Kid Mode 2 → **pass**.
- Heavy requested at medium and small silently demotes to normal rock → **pass**.
- A wave-20 hulk (7 hp) takes exactly 7 chip hits, then splits into 2 **non-heavy**
  mediums → **pass**.
- Shield ram: −2 hp, −30 shield, player pushed 17px clear, rock survives — verified at
  dead-centre, 20px and grazing offsets → **pass**.
- Torpedo `vaporizeAsteroid` still deletes it outright → **pass** (intended).
- Unshielded contact still costs a life → **pass**.
- Draw path exercised at full/half/near-dead hp with the procedural fallback → no
  exceptions, no console errors.
- No stale crystal globals remain (`generateCrystalVerts` undefined).

**Bug found and fixed during verification:** the new shield-ram bounce divided by
`(contactDist || 1)`, so a dead-centre overlap produced a zero push vector and left the
player stuck inside the hulk, chipping it and burning 30 shield every frame. Now falls
back to `player.angle`. The pre-existing Rift Tendril ram has the identical latent
divide — **not** fixed here (unrelated to this change) but logged in `TODO.md`.

**Honest caveat on the shield grind:** a full 100 shield bar affords 4 rams = 8 damage,
which *can* just barely finish a hulk. It costs the entire bar plus four approach
cycles in a live wave-20 field, and shooting it is strictly faster, so it is
self-balancing rather than an exploit — but it is not the hard "cannot be rammed down"
guarantee, and it is a tuning knob if play disagrees.

**Not verified (needs the owner):** whether 5–8 hits is *work* or a *chore*, whether the
18→30% share becomes a wall by wave 25, and whether the plating reads as armoured at a
glance without the dedicated sprite. All three are in `TODO.md`.

### Open Threads

| Thread | Next Step |
|---|---|
| Void Iron feel (hp, share, drop rate) | Owner playtest; knobs named in `TODO.md` |
| Void Iron sprite | Codex, brief in `docs/SPRITE_STATUS.md` |
| Tendril dead-centre ram divide | Small fix, logged in `TODO.md` |

### What To Do Differently

- **Four difficulty changes now sit on the same wave band** (×2 decay, lives cap, tier
  badges, Void Iron). That is more than one variable per playtest. Judge them together
  and resist pulling another lever until this build has been played.

---

## Update — 2026-08-07 (same session, third follow-up): sprite decision and ship

### Does Void Iron actually need a sprite?

Owner asked. Measured rather than guessed, and the answer was less clear-cut than
expected:

- **85.8% of the rendered hulk is the procedural plating**; only 14.2% of the
  underlying rock master shows through, at the hub and rim. A dedicated master would
  mostly be replacing pixels nobody sees.
- The hulk already occupies **1.3× a normal rock's footprint** (radius 48 vs 42 —
  matches the 1.31 area ratio exactly).
- The seam energy has to stay procedural regardless: it is stateful, brightening 0.14
  → 0.86 with damage. Same reasoning that keeps the boss node pips and the gravity
  well procedural.

**One real gap, and it is a code gap rather than a missing asset.** Because a rock
master renders, the *silhouette* is a rock silhouette — `generateHeavyVerts()` builds
the blocky machined outline and it is then never drawn, since the procedural body only
runs when no sprite is available. So the "machined, not weathered" intent is currently
invisible in the shipping configuration. Fixable in code (clip to the angular
silhouette, or always draw the procedural body for heavies); left undone deliberately,
pending a playtest that says the outline is what needs fixing.

### Generated master: attempted, rejected, reverted

Wrote `tools/generate_void_iron.js` — a zero-dependency Node generator (analytic
height field → normals → Lambert shade, hand-rolled PNG encoder over built-in zlib).
It produced a technically compliant 1254×1254, 819KB master: matte by construction
(hard-clamped to max channel 102, only 584 pixels ever hit the cap) with dark unlit
seams left empty for the engine's crack-energy.

**It looked like a manhole cover.** Rendering and *looking at it* — rather than
trusting the constraint checks — showed the failure immediately:

- Six even angular sectors around a central hub with a bore ring read as a wheel or a
  drain cover, not a rock. Radial symmetry was the core mistake.
- Textures were inverted: the coarse `fbm` grain landed on the plate faces (reading as
  rough concrete) while the frame read as metal — exactly backwards.
- No dome. A flat disc of plating, where the other asteroid masters use radial
  gradient shading to sell a 3D boulder.

A second pass was started (Voronoi patchwork plating so cells are irregular and about
a third stay bare rock, plus an analytic sphere normal under the detail normal) before
the owner redirected: **Codex will make the sprite.** Both the generator and the
generated PNG were deleted — leaving the PNG on disk would have been actively harmful,
since the renderer would load it and draw the manhole cover in place of the working
procedural plating. Verified after deletion that the fallback path is live again
(intact 4.0% over the bloom threshold, nearly-broken 24.7%, background exactly
`#05010A`).

**Lesson worth keeping: constraint checks are not an art review.** Every automated
check passed on a sprite that was obviously wrong the moment it was viewed. `Read` on
the PNG is a cheap way to actually look at generated art, and it should be the first
step, not the last.

### Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| Codex makes the Void Iron sprite | Painted art gives the irregular, believable metal a procedural generator did not; the brief is already written | — |
| Delete the generated PNG rather than keep it as a placeholder | The renderer auto-loads any file at that path, so a bad placeholder is worse than none — the procedural fallback is better art | — |
| Leave the silhouette gap unfixed | It is a code fix, not an art gap; wait for a playtest to say whether the outline is what reads wrong | After the difficulty-pass playtest |

### Ship

Branched, committed and merged to `main`. The working tree at commit time was exactly
the difficulty pass — no generated art, no generator.

**Nothing in this build has been played.** Logic, rendering and frame-rate independence
are verified; the balance of four simultaneous difficulty changes is not. The commit is
a restore point, not a statement that the tuning is right.
