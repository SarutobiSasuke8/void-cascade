---
title: Session Log - Rift Tendril
date: 2026-08-07
status: complete
type: session-log
mutability: append-only
project: void-cascade
agent: Codex
tags:
  - session-log
  - enemies
---

# Session Log - Rift Tendril

## Executive Summary

Added the Rift Tendril as a slow, durable, visually telegraphed rammer while
preserving the purple firing enemy's existing Rift Stalker identity.

## Trigger

The player clarified that the generated squid-like enemy was a new enemy type,
not the already-established Rift Stalker fighter, and specified its desired ram
behaviour and wave pacing.

## Work Completed

- Renamed the generated asset set to `rift_tendril` using the project's
  snake_case convention.
- Produced a transparent runtime sprite from the master artwork.
- Implemented drift, core-swell wind-up, prow-first charge and recovery states.
- Spawned one Tendril from wave 5 and capped Rift Stalkers at two while present.
- Made the Tendril start at 5 HP, scale only every five waves, and survive a
  full-health torpedo strike.

## Decisions

| Decision | Reason | Revisit When |
|---|---|---|
| One Tendril per wave | It reads as an encounter anchor rather than another swarm. | Late-wave playtests show insufficient pressure. |
| No projectile attack | Keeps the Tendril distinct from Rift Stalkers. | A later boss or enemy roster needs overlap. |
| Core swell controls the wind-up | The attack needs a fair, visual dodge contract. | The sprite gets dedicated frame animation. |

## Files Touched

| File | Change |
|---|---|
| `play/index.html` | Tendril sprite, AI states, combat durability and spawn cap. |
| `assets/enemies/rift_tendril/` | Master, preview and transparent runtime sprite. |
| `tools/prepare_rift_tendril_sprite.py` | Reproducible background extraction. |
| `STYLE_GUIDE.md` | Enemy design contract. |

## Verification

- JavaScript extracted from `play/index.html` passed Node syntax checking.
- Runtime sprite verified as RGBA, 1434 × 746 px, with fully transparent corners.
- Browser playtest remains required; the local browser automation command is not
  available in this environment.
- Playtest checklist verdict: `pass with issues` (browser gameplay pending).

## Open Threads

| Thread | Next Step |
|---|---|
| Tendril feel | Play wave 5 and tune wind-up, charge speed and recovery. |
