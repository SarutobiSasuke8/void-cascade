"""Create the transparent runtime sprite from the Rift Tendril master artwork."""

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "enemies" / "rift_tendril"
SOURCE = ASSET_DIR / "rift_tendril_master.png"
OUTPUT = ASSET_DIR / "rift_tendril_01.png"
VOID = np.array([5, 1, 10], dtype=np.float32)


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")
    pixels = np.asarray(image).astype(np.float32)
    distance = np.linalg.norm(pixels - VOID, axis=2)
    # The master has a uniform #05010A void. Preserve softly antialiased edges
    # while excluding the void so the sprite can sit over the live starfield.
    alpha = np.clip((distance - 8.0) * 12.0, 0, 255).astype(np.uint8)
    alpha[alpha < 8] = 0
    rgba = np.dstack((pixels.astype(np.uint8), alpha))
    sprite = Image.fromarray(rgba, "RGBA")
    # Image generation can leave a few nearly-black anti-alias pixels in the
    # far corners. They are invisible but would prevent a useful tight crop.
    bounds = Image.fromarray(np.where(alpha > 32, 255, 0).astype(np.uint8)).getbbox()
    if not bounds:
        raise RuntimeError("Rift Tendril extraction found no opaque pixels")
    left, top, right, bottom = bounds
    padding = 18
    sprite = sprite.crop((max(0, left - padding), max(0, top - padding),
                          min(sprite.width, right + padding), min(sprite.height, bottom + padding)))
    sprite.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
