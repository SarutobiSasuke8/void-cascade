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

- Target aspect / virtual resolution: `TODO — document once fixed`
- Base sprite resolution: `TODO — document once fixed`
