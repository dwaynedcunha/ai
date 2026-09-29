import cv2
import numpy as np


def resize_image(image, max_width=1600):
    if image is None:
        return None
    height, width = image.shape[:2]
    if width <= max_width:
        return image
    scale = max_width / width
    new_width = int(width * scale)
    new_height = int(height * scale)
    return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)


def to_grayscale(image):
    if image is None:
        return None
    if len(image.shape) == 2:
        return image
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def reduce_noise(image):
    if image is None:
        return None
    gray = to_grayscale(image)
    return cv2.GaussianBlur(gray, (5, 5), 0)


def enhance_contrast(image):
    if image is None:
        return None
    gray = to_grayscale(image)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def threshold_image(image, block_size=15):
    if image is None:
        return None
    gray = to_grayscale(image)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    if block_size % 2 == 0:
        block_size += 1
    return cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, 10
    )


def morphological_cleanup(image):
    if image is None:
        return None
    kernel = np.ones((3, 3), np.uint8)
    image = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
    return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)


def preprocess_for_plate_detection(image):
    resized = resize_image(image)
    gray = to_grayscale(resized)
    blurred = reduce_noise(gray)
    enhanced = enhance_contrast(blurred)
    thresholded = threshold_image(enhanced, block_size=17)
    cleaned = morphological_cleanup(thresholded)
    return cleaned


def preprocess_plate_for_ocr(plate_crop):
    if plate_crop is None:
        return None
    gray = to_grayscale(plate_crop)
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    gray = enhance_contrast(gray)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    _, thresholded = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresholded = morphological_cleanup(thresholded)
    return thresholded
