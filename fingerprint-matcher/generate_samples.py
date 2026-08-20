"""Generate tiny synthetic fingerprint-like images for unit tests.

Run this script once from the ``fingerprint-matcher/`` directory to create
the ``sample_images/`` folder with three test images:

* ``finger1.png``  — a synthetic ridge pattern
* ``finger1_copy.png`` — identical copy of finger1 (should match)
* ``finger2.png``  — a different synthetic pattern (should NOT match)
* ``blank.png``    — a blank white image (should trigger spoof check)
"""
import os
import cv2
import numpy as np

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_images")


def _draw_ridges(img, seed=42):
    """Draw random line-based 'ridges' on a grayscale image."""
    rng = np.random.RandomState(seed)
    h, w = img.shape
    for _ in range(60):
        x1, y1 = rng.randint(0, w), rng.randint(0, h)
        x2, y2 = rng.randint(0, w), rng.randint(0, h)
        thickness = rng.randint(1, 3)
        color = int(rng.randint(0, 120))
        cv2.line(img, (x1, y1), (x2, y2), color, thickness)
    return img


def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # finger1 — synthetic ridges with seed 42
    img1 = np.full((300, 300), 200, dtype=np.uint8)
    img1 = _draw_ridges(img1, seed=42)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "finger1.png"), img1)

    # finger1_copy — exact copy (will match perfectly)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "finger1_copy.png"), img1)

    # finger2 — different seed → different pattern
    img2 = np.full((300, 300), 200, dtype=np.uint8)
    img2 = _draw_ridges(img2, seed=99)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "finger2.png"), img2)

    # blank — a uniform white image (spoof-like)
    blank = np.full((300, 300), 255, dtype=np.uint8)
    cv2.imwrite(os.path.join(OUTPUT_DIR, "blank.png"), blank)

    print(f"Sample images written to {OUTPUT_DIR}/")


if __name__ == "__main__":
    generate()
