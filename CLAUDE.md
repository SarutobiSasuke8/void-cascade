# CLAUDE.md — Void Cascade Agent Contract

Canonical operating rules for any AI agent working in this repository.

Adapted from `vibe-coding-game-template`. Deliberately kept as a single file: this is a
solo, zero-dependency project, so there are no `AGENTS.md` / `CODEX.md` / `GEMINI.md`
adapters to keep in sync.

## Project Identity

- **Project:** Void Cascade — *Shatter the void. Master the cascade.*
- **Type:** Browser arcade game (Asteroids/Maelstrom lineage), single-player prototype
- **Stage:** Active build, private prototype
- **Repo:** https://github.com/SarutobiSasuke8/void-cascade

## Product Goal

A visually spectacular, skill-based arcade score chase. Cinematic deep-space intensity
with neon energy and explosive particle work — Geometry Wars meets Asteroids meets
high-end indie. Single-player visual spectacle is the priority; multiplayer is secondary.

The feeling to protect: **everything important glows, the void stays almost black, and
the particles carry the emotional weight.**

## Stack Reality

There is no build step, no package manager, no framework, and no dependencies.

- `play/index.html` — the entire game: markup, CSS, gameplay, rendering, audio, UI
- `play/postfx.js` — WebGL post-processing chain (6-level mip bloom, chromatic
  aberration, vignette, tone mapping); the game must still run if WebGL is unavailable
- Gameplay renders to an offscreen 2D canvas, then through the postfx chain
- The simulation is frame-rate independent (verified at 60 / 120 / 144Hz) — **any new
  motion, timer, or cooldown must be `dt`-scaled, never per-frame**

Run it by opening `play/index.html` directly from the filesystem. No server required.

**Do not** introduce a bundler, framework, or npm dependency. If something seems to
require one, raise it before building.

## Operating Loop

For non-trivial work:

1. Read this file, `STYLE_GUIDE.md`, and the relevant code before editing.
2. State assumptions, ambiguities, and tradeoffs when they matter.
3. Define success criteria before implementing.
4. Make the smallest coherent change.
5. Verify with the narrowest meaningful check.
6. Report what changed, what was verified, and what risk remains.

For trivial one-line fixes, keep it light.

## Core Principles

### 1. Think Before Coding

- State assumptions explicitly rather than silently picking an interpretation.
- Ask when the ambiguity changes implementation or risk.
- Push back when a simpler or safer path better serves the goal.
- Stop and name confusion before building on it.

### 2. Simplicity First

- No speculative features, no abstractions for single-use code.
- No configurability that was not requested.
- `play/index.html` is already large — resist adding to it without cause, but do not
  refactor it into modules as a side quest either.

### 3. Surgical Changes

- Touch only what the task requires.
- Do not reformat or restyle adjacent code for taste.
- Preserve user-authored comments and docs unless the task asks to edit them.
- Mention unrelated issues instead of fixing them silently — put them in `TODO.md`.

### 4. Goal-Driven Execution

- Bug fix: reproduce or identify the failing behaviour, then fix it.
- Feature: define the user-visible behaviour and acceptance checks.
- Refactor: preserve behaviour before and after.
- Visual change: verify the actual screen, not just the code.

### 5. Quality Bar

- **The first screen must be playable.** The menu exists to start play, not to substitute
  for it.
- **Protect the playfield.** HUD, overlays and modals must never block the core interaction.
- **Input must feel instant.** Perceptible lag is a bug to investigate before any new feature.
- The core loop — input → objective → death → restart — outranks breadth of content.
- Loading, pause and failure states get the same intentional design as the happy path.
- Polish is functional quality here, not decoration. The visual spectacle *is* the product.
- Follow `STYLE_GUIDE.md` exactly on colour tokens, glow rules and ship/asteroid design.
  It is the source of truth and supersedes older decisions recorded elsewhere.

## Verification Policy

Run the narrowest useful check before finishing:

| Change type | Verification |
|---|---|
| Gameplay, input, core loop | Full pass of `docs/PLAYTEST_CHECKLIST.md` |
| Rendering / postfx | Pixel probes (measure, do not eyeball); confirm background stays `#05010A` |
| Performance-sensitive | Frame-time smoke over 400+ frames; report median and p95 |
| Timing / waves / spawns | Simulate at 60, 90 and 144Hz — frame-rate bugs hide at 60 only |
| Input changes | Re-verify against `docs/INPUT_CONTROL_MAP.md` and update it in the same change |
| Asset changes | Confirm no dead `src` paths; add a row to `assets/CREDITS.md` **and** update `docs/SPRITE_STATUS.md` |
| Any change | No console errors across start → play → death → restart |

If verification cannot be run, say exactly why and state the residual risk.

## Documentation Rules

| Content | Location |
|---|---|
| Visual/audio/art bible | `STYLE_GUIDE.md` |
| Playtest gate | `docs/PLAYTEST_CHECKLIST.md` |
| Control mapping | `docs/INPUT_CONTROL_MAP.md` |
| Asset conventions | `docs/ASSET_PIPELINE.md` |
| Sprite done/needed tracker | `docs/SPRITE_STATUS.md` |
| Asset licensing | `assets/CREDITS.md` |
| Working queue | `TODO.md` |
| Session history | `Session Logs/` (append-only, see the index) |
| Player-facing overview | `README.md` |

## Session Logs

Create or append a log in `Session Logs/` for any session with architectural decisions,
multi-file work, debugging findings worth keeping, or handoff context. Use
`docs/SESSION_LOG_TEMPLATE.md`. Filename: `YYYY-MM-DD-session-log-short-topic.md`.
Logs are **append-only** — do not rewrite history; append a dated update instead.

## Git Hygiene

- Do not revert work you did not make.
- No destructive git commands unless explicitly requested.
- Keep commits focused; mention changed files and verification in the handoff.

## Handoff Format

- **Change:**
- **Files:**
- **Verification:**
- **Risks / follow-ups:**
