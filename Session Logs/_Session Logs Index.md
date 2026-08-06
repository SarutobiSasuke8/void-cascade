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

## Current Themes

- Frame-rate independence is the recurring bug class — the wave-clear swarm only appeared
  because a per-frame check met a millisecond timer. Test timing changes at 144Hz.
- Rendering fixes need measurement, not eyeballing. Pixel probes caught a 33% tone-curve
  dimming that looked like "bloom is just subtle".
- The black background is load-bearing. Anything that lifts it (bloom knee, explosion
  flash) breaks the art direction immediately.
