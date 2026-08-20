"""Utility to load fingerprint images safely.

The function returns a grayscale ``numpy.ndarray`` suitable for further
processing with OpenCV.  If the file cannot be read, a ``FileNotFoundError``
is raised.
"""
import cv2
import numpy as np
from pathlib import Path

def load_image(filepath: str) -> np.ndarray:
    """Load an image from ``filepath`` as a grayscale ``numpy`` array.

    Args:
        filepath: Path to the image file.

    Returns:
        A ``numpy.ndarray`` with ``dtype=uint8`` representing the grayscale
        image.
    """
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"Image file not found: {filepath}")
    # ``cv2.IMREAD_GRAYSCALE`` loads the image directly in gray space.
    img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Failed to load image as grayscale: {filepath}")
    return img
