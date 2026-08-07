---
title: Session Log - Cockpit frame glow tiers for weapon stacks
date: 2026-08-08
status: complete
type: session-log
mutability: append-only
project: void-cascade
agent: Claude Code (Fable 5)
tags:
  - session-log
---

# Session Log - Cockpit frame glow tiers for weapon stacks

## Executive Summary

The cockpit frame now reacts to the weapon loadout: at any ×2 stack the cyan
edge-light warms subtly, and at ×3 (OVERCHARGE) the whole frame floods gold with
a slow breathing pulse. Implemented as a second copy of the frame image with a
pre-baked stronger drop-shadow, faded in by opacity only, so the per-frame cost
stays on the compositor. Along the way the preview server gained `PORT` env-var
support so `preview_start` can auto-assign a port when 4173 is taken.

## Trigger

Owner request with a screenshot of the cockpit strips: "at 2x a small degree of
glow effect, then at 3x a much more visible glow effect."

## Starting State

- Branch `main` at `b07ddab` (HUD full brightness while paused).
- `#hudFrame img` had a single static glow: `drop-shadow(0 0 7px rgba(0,245,255,0.22))`.
- Weapon stacks live in `player.weapons` (0–3); ×3 is timed OVERCHARGE, gold is
  its reserved token (`STYLE_GUIDE.md`), ×2 decays on `TIER2_TIME`.

## Work Completed

- Added `#hudFrameGlow` — a second `<img>` of `cockpit_overlay_hud.png` inside
  `#hudFrame`, opacity 0, `transition: opacity 0.5s`.
- Tier classes on `#hudFrame`: `.stack2` → cyan double drop-shadow at opacity
  0.45; `.stack3` → gold double drop-shadow at opacity 1 plus a 1.8s
  `frameGlowPulse` opacity animation.
- `setFrameGlow(stack)` (cached, class-swap only) called from `renderWeapons()`
  with `max(rapid, spread, pierce)`; `endGame()` clears the tier explicitly
  because the frame stays visible behind the game-over screen where
  `renderWeapons()` no longer runs.
- `preview-server.js` now falls back to `process.env.PORT` before 4173, and
  `.claude/launch.json` sets `"autoPort": true`.

## Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| ×3 glow is gold, not brighter cyan | Gold is the reserved OVERCHARGE token; the frame flooding gold reads as "overcharge active", matching the HUD chip language | If gold at frame scale overwhelms the reward token elsewhere |
| Second image layer, opacity-only animation | Animating `filter` on a full-screen image re-rasterizes every frame; opacity is compositor-only. Filter swap between tiers is a one-off | If the extra full-screen layer ever shows up in frame profiles |
| Tier = strongest single stack | Simple read: "my best weapon tier is my cockpit state"; a sum would light gold from three permanent ×1s | If playtest wants glow to reflect total loadout instead |

## Files Touched

| File | Change |
|---|---|
| `play/index.html` | `#hudFrameGlow` markup + tier CSS + `setFrameGlow()` + hooks in `renderWeapons()`/`endGame()` |
| `preview-server.js` | `PORT` env-var fallback for auto-assigned preview ports |
| `.claude/launch.json` | `autoPort: true` |
| `TODO.md` | Eyeball check queued; root-URL serve quirk noted |

## Verification

Per `CLAUDE.md` verification policy. Include measurements, not impressions.

- Computed-style probes on the live preview (pane cannot composite, so probes
  instead of pixels — same constraint already noted in TODO for frame timing):
  - tier 0: no classes, `opacity: 0`, no animation.
  - `player.weapons.spread = 2` + `renderWeapons()` → class `stack2`,
    target `opacity: 0.45`, cyan `drop-shadow(rgba(0,245,255,0.65) 0 0 9px) …20px`, no animation.
  - `player.weapons.rapid = 3` → class `stack3` (replaces `stack2`), target
    `opacity: 1`, gold `drop-shadow(rgba(255,210,63,0.85) 0 0 12px) …28px`,
    `frameGlowPulse` running.
  - clear all stacks → classes empty; `setFrameGlow(3)` then `setFrameGlow(0)`
    (endGame path) → classes empty.
- No console errors on the `/play/` page across menu → play → probes. The two
  404s + `createPostFX` errors in the console came from the auto-opened root
  URL `/` (pre-existing server quirk, logged in TODO), not from this change.
- Background untouched — the glow layer sits in the DOM above the canvas;
  `#05010A` is not lifted by it.
- Frame-rate independence: CSS transition/animation are wall-clock, no game
  timers added.

## Open Threads

| Thread | Next Step |
|---|---|
| Glow intensity set by computed values, not eyes | Eyeball ×2/×3 in a real browser; knobs are the two `#hudFrameGlow` filter lines and the `.stack2` opacity |
| Root URL `/` serves `/play/index.html` without redirecting | `preview-server.js`: 302 to `/play/` instead of serving content at `/` |

## What Worked

- Opacity-crossfade over a pre-filtered duplicate layer: all the visual change,
  none of the per-frame filter cost.
- Driving `renderWeapons()` by hand in the preview when the rAF loop was frozen
  (non-compositing pane) — logic verified without a visible browser.

## What To Do Differently

- Nothing notable; small surgical change.

## Connected

- `2026-08-07-session-log-wave26-difficulty-tuning.md` — the ×2 decay and
  OVERCHARGE timing this glow now surfaces at cockpit scale.
