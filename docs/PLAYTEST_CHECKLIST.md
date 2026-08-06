# Playtest Checklist

Run this after gameplay, input, rendering or core-loop changes, and before calling any
milestone done. Copy it into the session log and mark each item.

## Core Loop

- [ ] The menu starts play in one action; no screen pretends to be a game.
- [ ] The objective reads in the first few seconds without instructions.
- [ ] Ship rotation, thrust and inertia feel correct on both keyboard and gamepad.
- [ ] Asteroids split into smaller, faster fragments on every hit tier.
- [ ] Death is clearly communicated; lives decrement and the HUD ship icons match.
- [ ] Game over → restart returns to a **clean** state: score, wave, lives, shield,
      power-ups, particles and all pending spawn timers reset.
- [ ] Quit to menu cancels pending spawn timers (no ghost spawns on the next run).

## Waves and Difficulty

- [ ] Clearing a wave advances by exactly **one** wave and queues exactly one spawn set.
- [ ] Verified at 60Hz **and** 144Hz — the wave-transition guard is a frame-rate bug class
      that only appears at high refresh.
- [ ] Enemy (Rift Stalker) spawn counts match the intended wave thresholds.
- [ ] Kid Mode measurably eases difficulty and auto-assists the shield without changing
      any documented key.

## Input and Feel

- [ ] Input responds without perceptible lag.
- [ ] Held keys, rapid presses and simultaneous inputs behave sensibly (thrust + rotate +
      fire + shield together).
- [ ] Controls match `docs/INPUT_CONTROL_MAP.md`; no undocumented inputs.
- [ ] Rebinding a key persists and takes effect immediately.
- [ ] Typing in the high-score name field does **not** steer the ship, fire, mute or
      toggle bloom.
- [ ] `Space` / arrows / `Backspace` do not scroll the page or trigger browser-back.
- [ ] Gamepad connect mid-play is picked up; disconnect does not lock a held input on.

## Playfield and Visuals

- [ ] HUD and overlays never block the core interaction.
- [ ] The playfield stays legible at the smallest supported window size.
- [ ] Pause stops the simulation cleanly and resumes without a time-step spike.
- [ ] Background stays effectively pure black (`#05010A`) — no bloom leak, no explosion
      flash revealing the grid.
- [ ] Every dangerous or interactive element glows (`STYLE_GUIDE.md` glow rule).
- [ ] Bloom toggle (`B`) visibly changes the image and does not break rendering.
- [ ] With WebGL forced off, the game still runs unprocessed rather than failing.
- [ ] No sprite renders as a broken/blank image (`assets/` paths all resolve).

## Audio

- [ ] Theme music starts, loops without a click, and restarts cleanly on a new run.
- [ ] Mute (`M`) silences everything and unmutes cleanly.
- [ ] No audible clipping when many explosions overlap.

## Stability and Performance

- [ ] No console errors across a full loop: start → play → death → restart → quit.
- [ ] Frame time holds during the busiest moment (late wave, full particle load).
      Record median and p95 over 400+ frames.
- [ ] Losing window focus and returning does not break state or produce a `dt` spike.
- [ ] Resizing mid-play does not break rendering, the postfx chain, or input.
- [ ] A full run leaves no leaked timers, listeners or unbounded arrays.

## Result

- Date:
- Build/commit:
- Tester:
- Verdict: `pass | pass with issues | fail`
- Issues found (file follow-ups in `TODO.md`):

A broken restart, a wave-count bug, laggy input, or a dead asset path fails the build no
matter how much else works.
