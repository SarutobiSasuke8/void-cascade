"""Build a small looping preview animation from the Rift Tendril master sprite."""

from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageFilter, ImageChops


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "enemies" / "rift_tendril"
SOURCE = OUTPUT / "rift_tendril_master.png"
BACKGROUND = (5, 1, 10)
FRAME_COUNT = 12


def animate_frame(source: Image.Image, phase: float) -> Image.Image:
    """Use a phase-shifted vertical field that is strongest in the rear tentacles."""
    rgba = np.asarray(source.convert("RGBA"))
    height, width = rgba.shape[:2]
    yy, xx = np.mgrid[0:height, 0:width]
    # The nose is at the right; the rear tentacles receive the largest undulation.
    rear_weight = np.clip((width * 0.76 - xx) / (width * 0.58), 0.0, 1.0) ** 1.7
    offset = rear_weight * 11.0 * np.sin(phase + (width - xx) * 0.022)
    sample_y = np.clip(np.rint(yy - offset), 0, height - 1).astype(np.int32)
    warped = Image.fromarray(rgba[sample_y, xx], "RGBA")

    # A restrained additive-feeling magenta pulse over the existing core.
    core_x, core_y = int(width * 0.586), int(height * 0.500)
    pulse = (math.sin(phase) + 1.0) * 0.5
    radius = int(52 + 26 * pulse)
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px = glow.load()
    for y in range(max(0, core_y - radius * 2), min(height, core_y + radius * 2)):
        for x in range(max(0, core_x - radius * 2), min(width, core_x + radius * 2)):
            distance = math.hypot(x - core_x, y - core_y)
            if distance < radius * 2:
                alpha = int(38 * pulse * max(0.0, 1.0 - distance / (radius * 2)) ** 2)
                px[x, y] = (255, 0, 170, alpha)
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 2))
    return Image.alpha_composite(warped, glow)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Master sprite not found: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    frames = [animate_frame(source, 2 * math.pi * i / FRAME_COUNT) for i in range(FRAME_COUNT)]
    frames[0].save(
        OUTPUT / "rift_tendril_idle.gif",
        save_all=True,
        append_images=frames[1:],
        duration=83,
        loop=0,
        disposal=2,
        optimize=False,
    )


if __name__ == "__main__":
    main()
