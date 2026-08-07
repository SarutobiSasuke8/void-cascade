---
type: session-log-index
status: active
mutability: living
---

# Session Logs

Durable records of meaningful work sessions on Void Cascade. These preserve decisions,
rationale, measurements and handoff context that would otherwise vanish into chat history.

## Logging Rule

Create or append a log when a session includes one or more of:

- Architectural, product or art-direction decisions.
- Multiple files touched.
- Debugging with findings worth keeping (especially frame-rate or rendering bugs).
- Handoff context a future session will need.
- Feedback that changes project direction.

One-line fixes do not need a log.

## Conventions

- Filename: `YYYY-MM-DD-session-log-short-topic.md`
- Template: `docs/SESSION_LOG_TEMPLATE.md`
- **Append-only.** Do not rewrite past entries; if new context changes the reading, append
  a dated update at the bottom.
- Add the log to the list below in the same change.

## Logs

- [2026-08-06 — Visual overhaul, audio, gameplay fixes](2026-08-06-session-log-visual-overhaul-audio-gameplay.md)
  — bloom pipeline rewrite (6-level mip pyramid), wave-clear swarm bug, procedural audio,
  ship/asteroid/enemy redesign, rebindable controls, leaderboard names.
- [2026-08-07 — Weapon stacks, scoring systems, audio upgrade, cockpit HUD](2026-08-07-session-log-weapons-scoring-audio-hud.md)
  — stackable persistent weapons (rapid/spread/pierce), torpedo vaporise + blast wave,
  wave tally, multiplier stars, extra ships, lost starfighter, torpedo icon rack,
  CSS cockpit frame, bigger ship, explosion bus (reverb/drive/pan/compressor),
  menu-music autoplay handling. **Appended same day:** armoured asteroids and particle
  pooling (late-wave p95 96.9ms → 13.9ms), life economy rebalance and cap, rebuilt
  thruster, wave tally/toasts moved to DOM for legibility.

- [2026-08-07 — Hazards, boss, skins, touch, music scenes](2026-08-07-session-log-hazards-boss-skins-touch.md)
  — thruster-as-acceleration SFX, timed OVERCHARGE tier, drift mines, gravity wells,
  crystal asteroids, the Cascade Core (wave-10 boss with wrap-charge), music scene
  mixer with optional SUNO stems, ship skins, touch controls, HUD fit pass, pause
  keeps cockpit. **Note: ran concurrently with the Rift Tendril session in the same
  file — merged cleanly, verified post-merge, but don't repeat two-agent editing.**

## Current Themes

- Frame-rate independence is the recurring bug class — the wave-clear swarm only appeared
  because a per-frame check met a millisecond timer. Test timing changes at 144Hz.
- Rendering fixes need measurement, not eyeballing. Pixel probes caught a 33% tone-curve
  dimming that looked like "bloom is just subtle".
- The black background is load-bearing. Anything that lifts it (bloom knee, explosion
  flash) breaks the art direction immediately.
- Bloom is indiscriminate: it re-blows out *anything* above its threshold, so text the
  player must read cannot live on the game canvas. Canvas for the world, DOM for words.
- Spectacle has a hidden cost curve. Particle counts and entity counts that feel right
  at wave 5 are the direct cause of late-wave stutter; profile p95, not median, and
  suspect GC when every phase spikes together.
