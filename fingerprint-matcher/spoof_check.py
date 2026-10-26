"""Spoof detection for fingerprint images.

Uses simple image-quality heuristics (contrast and detail level) to flag
potentially spoofed or fake fingerprint images.  This is a basic rule-based
check — NOT a machine-learning model.
"""
import cv2
import numpy as np
from dataset_loader import load_image


def check_for_spoof(image_path: str):
    """Check whether a fingerprint image or binary template looks like a spoof/fake."""
    import os
    if not os.path.exists(image_path):
        return True, "Fingerprint file does not exist"

    # If it's a binary template file or non-visual image
    img = load_image(image_path)
    if img is None:
        try:
            with open(image_path, 'rb') as f:
                raw_bytes = f.read()
            if len(raw_bytes) == 0:
                return True, "Empty biometric template file (0 bytes)"
            if len(set(raw_bytes)) < 3:
                return True, "Blank or uniform synthetic biometric template"
            return False, "Biometric binary template passed integrity check"
        except Exception as e:
            return True, f"Failed to read biometric template file: {e}"

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
