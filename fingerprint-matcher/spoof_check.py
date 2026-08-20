"""Spoof detection for fingerprint images.

Uses simple image-quality heuristics (contrast and detail level) to flag
potentially spoofed or fake fingerprint images.  This is a basic rule-based
check — NOT a machine-learning model.
"""
import cv2
import numpy as np
from dataset_loader import load_image


def check_for_spoof(image_path: str):
    """Check whether a fingerprint image looks like a spoof/fake.

    The check measures two properties:
    1. **Contrast** — standard deviation of pixel intensities.  Real
       fingerprints typically have moderate contrast; a very low value
       suggests a blank or uniformly coloured image.
    2. **Detail / sharpness** — variance of the Laplacian.  Real prints
       contain fine ridge detail which produces a higher Laplacian variance.

    Args:
        image_path: Path to the fingerprint image.

    Returns:
        tuple: ``(is_spoof: bool, reason: str)``
            * ``is_spoof`` is ``True`` when the image is suspicious.
            * ``reason`` is a human-readable explanation.
    """
    img = load_image(image_path)

    # --- Contrast check (standard deviation of intensities) ---
    std_dev = float(np.std(img))
    CONTRAST_THRESHOLD = 15.0  # below this → suspicious

    # --- Detail / sharpness check (Laplacian variance) ---
    laplacian = cv2.Laplacian(img, cv2.CV_64F)
    lap_var = float(laplacian.var())
    DETAIL_THRESHOLD = 50.0  # below this → suspicious

    reasons = []
    if std_dev < CONTRAST_THRESHOLD:
        reasons.append(
            f"Very low contrast (std_dev={std_dev:.1f}, "
            f"threshold={CONTRAST_THRESHOLD})"
        )
    if lap_var < DETAIL_THRESHOLD:
        reasons.append(
            f"Very low detail/sharpness (laplacian_var={lap_var:.1f}, "
            f"threshold={DETAIL_THRESHOLD})"
        )

    if reasons:
        return True, "Possible spoof: " + "; ".join(reasons)
    return False, "Image appears genuine (passed contrast and detail checks)"
