# Asset Pipeline

Conventions for Void Cascade assets. Placeholder art is fine; broken references,
inconsistent naming and untracked licensing are not.

## Folder Layout

```text
assets/
├── ships/            # player ship and future skins
├── enemies/          # Rift Stalkers and future factions
├── asteroids/
│   └── large/        # size tiers get their own subfolder
├── weapons/          # projectiles (torpedo, future secondaries)
├── powerups/         # pickup icons
├── backgrounds/      # menu and scene backdrops
├── ui/               # banner, HUD art, icons
├── audio/            # music and SFX
├── banner.jpg        # repo social preview
└── CREDITS.md        # source + licence for every asset
```

## Naming

- **`snake_case`**, matching what is already in the repo: `player_default.png`,
  `rift_stalker_01.png`, `shield_charge.png`.
- Numeric suffix for variants of the same thing: `asteroid_01.png`, `asteroid_02.png`.
- Suffix animation sheets with frame count when they arrive: `player_thrust_8f.png`.

Do not mix in kebab-case. Consistency matters more than which convention won.

## Rules

- Every asset referenced in code must exist in the repo. **No dead paths** — a missing
  sprite renders as nothing and is easy to miss against a black background.
- Record source and licence in `assets/CREDITS.md` at the moment the asset is added.
- Visual coherence is part of the vibe even at placeholder stage. Prefer a few consistent
  placeholders over mixed-style borrowed art.
- Compress before committing, audio especially — this repo is played straight off the
  filesystem, so payload size is load time.
- Art must obey `STYLE_GUIDE.md`: the palette tokens, the glow rule, and the current
  ship/asteroid/thruster decisions.

## Loading

Sprite paths are centralised in the `SPRITES` manifest at
[play/index.html:357](../play/index.html#L357). **Add new sprites there** — do not scatter
`new Image()` calls or path strings through gameplay code.

Two categories sit outside that manifest and are the documented exceptions:

- CSS backgrounds (`backgrounds/menu_home.png`)
- Markup-level `<img>` for the banner and HUD life icons

Paths are relative to `play/`, so they are prefixed `../assets/`.

- Sprites load asynchronously with no loading gate. Anything drawn in the first frames
  must degrade to its procedural/vector form rather than pop in blank.
- If a load ever becomes perceptible, add a real loading state — not a blank canvas.

## Constants

- Target aspect / virtual resolution: **none — the simulation runs at native window
  resolution**, capped at `MAX_PIXELS = 2,100,000` canvas pixels (≈1920×1080); above
  that the canvas renders smaller and CSS-scales up. There is no fixed aspect and no
  letterboxing: `W`/`H` are whatever the window gives, so gameplay code must never
  assume a resolution (documented 2026-08-07, from `resize()` in `play/index.html`).
- Base sprite resolution: **1254×1254 RGBA PNG** for master sprites (ship, stalker,
  asteroid — the existing convention). Sprites are drawn scaled far down (ship 58px,
  stalker ~68px, large rock ~103px), so masters have generous headroom; keep new
  masters square, transparent-background, and authored nose-right / facing +X.
