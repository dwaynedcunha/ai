import os
import cv2
import numpy as np

from src.preprocessing import preprocess_for_plate_detection

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))


def _find_optional_model():
    if not os.path.isdir(MODELS_DIR):
        return None
    for filename in os.listdir(MODELS_DIR):
        if filename.lower().endswith((".h5", ".keras", ".weights", ".pb")):
            return os.path.join(MODELS_DIR, filename)
    return None


def _load_optional_tf_detector():
    try:
        import tensorflow as tf  # type: ignore
        model_path = _find_optional_model()
        if model_path is None:
            return None
        if os.path.isfile(model_path):
            return tf.keras.models.load_model(model_path)
    except Exception:
        return None
    return None


def _candidate_plate_regions(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blur, 50, 200)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edged, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 500:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = w / float(h)
        if aspect_ratio < 1.5 or aspect_ratio > 8.0:
            continue
        if w < 40 or h < 15:
            continue
        candidates.append((x, y, w, h, area))

    if not candidates:
        return []
    candidates.sort(key=lambda item: item[4], reverse=True)
    return candidates[:10]


def _fallback_detect_plate(image):
    if image is None:
        return None

    processed = preprocess_for_plate_detection(image)
    contours, _ = cv2.findContours(processed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    best_score = 0

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 1000:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = w / float(h)
        if aspect_ratio < 1.5 or aspect_ratio > 8.0:
            continue
        score = area / (w * h + 1)
        if score > best_score:
            best = (x, y, w, h)
            best_score = score

    if best is None:
        candidates = _candidate_plate_regions(image)
        if not candidates:
            return None
        best = candidates[0][:4]

    x, y, w, h = best
    padding = 10
    x0 = max(0, x - padding)
    y0 = max(0, y - padding)
    x1 = min(image.shape[1], x + w + padding)
    y1 = min(image.shape[0], y + h + padding)

    crop = image[y0:y1, x0:x1]
    if crop.size == 0:
        return None

    return {
        "status": "success",
        "detector": "opencv",
        "box": (x0, y0, x1, y1),
        "crop": crop,
        "processed": processed,
    }


def detect_number_plate(image):
    if image is None:
        return {"status": "failed", "message": "Image is empty.", "detector": "none"}

    model = _load_optional_tf_detector()
    if model is not None:
        try:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            resized = cv2.resize(image_rgb, (224, 224))
            arr = np.expand_dims(resized, axis=0).astype("float32") / 255.0
            prediction = model.predict(arr, verbose=0)
            if prediction is not None:
                det = _fallback_detect_plate(image)
                if det is not None:
                    det["detector"] = "tensorflow_fallback"
                    return det
        except Exception:
            pass

    fallback = _fallback_detect_plate(image)
    if fallback is None:
        return {"status": "failed", "message": "No number plate detected.", "detector": "opencv"}
    return fallback
