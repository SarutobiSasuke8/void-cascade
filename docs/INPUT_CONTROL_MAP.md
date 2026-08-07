# Input / Control Map

Single source of truth for how Void Cascade is controlled. Update this **in the same
change** as any input edit; `docs/PLAYTEST_CHECKLIST.md` verifies the build against it.

Defaults live in `binds` at [play/index.html:490](../play/index.html#L490). Keys are
rebindable at runtime via the Controls screen.

## Primary Controls

| Action | Keyboard (default) | Gamepad |
|---|---|---|
| Rotate left | `←` / `A` | Left stick X (dead zone 0.2) |
| Rotate right | `→` / `D` | Left stick X (dead zone 0.2) |
| Thrust | `↑` / `W` | Button 0 (A) or Button 7 (RT) |
| Fire | `Space` / `Z` | Button 1 (B) or Button 2 (X) |
| Torpedo | `X` / `Left Ctrl` | Button 3 (Y) |
| Shield | `↓` / `Left Shift` | Button 5 (RB) |
| Pause / resume | `Esc` / `P` | — |

Shield and thrust are **held**, not tapped. Fire and torpedo are gated by their own
cooldowns, so holding is safe.

## Global / Meta Keys

| Action | Key | Notes |
|---|---|---|
| Toggle bloom | `B` | Flashes an on-screen FX label |
| Toggle mute | `M` | Flashes an on-screen FX label |
| Submit high-score name | `Enter` | Name-entry field only |

These are always live, including during play. They are intentionally not rebindable.

## Rules

- **Keyboard-first.** Every core action must be reachable without a mouse. The mouse is
  used only for menu, Controls screen and Kid Mode toggle.
- **No `Ctrl`-combinations for core play.** `Left Ctrl` alone is a torpedo default; do not
  add anything that requires a modifier *combination*.
- **Text input must escape game keys.** Both keydown handlers bail out when the event
  target is a text input — preserve this in any new handler
  ([play/index.html:526](../play/index.html#L526), [1668](../play/index.html#L1668)).
- **`preventDefault` list.** `Space`, arrows and `Backspace` are swallowed to stop page
  scroll and browser-back. Any new core binding that scrolls the page must be added there
  ([play/index.html:541](../play/index.html#L541)).
- Undocumented inputs are a playtest failure. If you add one, add a row here.

## Notes

- **Input model:** polled. A `keys[]` map is filled by keydown/keyup and read per frame by
  `down(action)`; the gamepad is sampled per frame into `gamepad.axes` / `gamepad.buttons`.
  Pause, bloom, mute and name submission are the exceptions — they are event-driven.
- **Rebinding:** two slots per action, edited on the Controls screen. Key labels are
  humanised via `KEY_LABELS` ([play/index.html:1691](../play/index.html#L1691)) — add a
  label whenever a new bindable key would otherwise show a raw `KeyCode`.
- **Gamepad dead zone:** 0.2 on both axes, hard-coded.
- **Kid Mode:** a menu checkbox, not an input binding. It auto-holds the shield and eases
  difficulty; it must never change what the documented keys do.
- **Touch:** implemented 2026-08-07, tested only with synthetic TouchEvents — needs a
  pass on real hardware.

## Touch Controls (added 2026-08-07)

Shown only when the device reports a coarse pointer (`pointer: coarse`), or on the
first real `touchstart`. Feeds a `touchCtl` object that is OR-ed with keyboard and
gamepad reads in the same polled model — no separate input path.

| Action | Control |
|---|---|
| Steer + thrust | Floating stick, left 52% of the screen: touch down plants the stick, drag ≥12px steers the ship toward the drag direction (angle-seeking, capped at keyboard turn rate), drag ≥26px also thrusts |
| Fire | FIRE button (hold to autofire), bottom right |
| Torpedo | TORP button, left of FIRE |
| Shield | SHLD button (held), above FIRE |
| Pause / resume | II button, top right corner |

All touch handlers `preventDefault()` and set `touch-action: none`, so play never
scrolls or zooms the page. The stick uses one touch identifier; buttons are
independent, so steer + fire + shield can be held simultaneously.
