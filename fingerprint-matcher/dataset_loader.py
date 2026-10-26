"""Utility to load fingerprint images safely.

The function returns a grayscale ``numpy.ndarray`` suitable for further
processing with OpenCV.  If the file cannot be read, a ``FileNotFoundError``
is raised.
"""
import cv2
import numpy as np
from pathlib import Path

def load_image(filepath: str):
    """Load an image from ``filepath`` as a grayscale ``numpy`` array.
    Returns None if the file is a binary template (.dat, .bin) rather than a visual image.
    """
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"Image file not found: {filepath}")
    try:
        img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        return img
    except Exception:
        return None
