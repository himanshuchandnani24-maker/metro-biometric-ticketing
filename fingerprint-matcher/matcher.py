"""Fingerprint matcher utilities.

Provides ``compare_fingerprints`` which uses ORB feature detection and
Brute‑Force matching to compute a similarity score between two fingerprint
images.
"""
import cv2
import numpy as np
from pathlib import Path
from dataset_loader import load_image

def _compute_keypoints_descriptors(image: np.ndarray):
    """Detect ORB keypoints and compute descriptors.

    Returns a tuple ``(keypoints, descriptors)``. If no keypoints are found,
    ``descriptors`` will be ``None``.
    """
    orb = cv2.ORB_create()
    keypoints, descriptors = orb.detectAndCompute(image, None)
    return keypoints, descriptors

def compare_fingerprints(image1_path: str, image2_path: str, score_threshold: float = 0.5):
    """Compare two fingerprint images.

    The function loads the images, extracts ORB features and matches them using a
    Brute‑Force Hamming distance matcher. A *match score* is defined as the
    ratio of good matches to the minimum number of keypoints in either image.

    Args:
        image1_path: Path to the first fingerprint image.
        image2_path: Path to the second fingerprint image.
        score_threshold: Threshold above which we consider the fingerprints to
            belong to the same finger (default ``0.5``).

    Returns:
        tuple: ``(score: float, is_match: bool)`` where ``score`` is in the range
        ``[0, 1]``.
    """
    img1 = load_image(image1_path)
    img2 = load_image(image2_path)

    kp1, desc1 = _compute_keypoints_descriptors(img1)
    kp2, desc2 = _compute_keypoints_descriptors(img2)

    if desc1 is None or desc2 is None:
        return 0.0, False

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(desc1, desc2)
    # Sort matches by distance (lower is better)
    matches = sorted(matches, key=lambda m: m.distance)

    # Use a simple distance threshold to consider a match "good"
    good_matches = [m for m in matches if m.distance < 60]

    min_kp = min(len(kp1), len(kp2))
    if min_kp == 0:
        return 0.0, False

    score = len(good_matches) / min_kp
    is_match = score >= score_threshold
    return score, is_match
