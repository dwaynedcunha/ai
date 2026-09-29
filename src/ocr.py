import re

import cv2
import numpy as np
import pytesseract

from src.preprocessing import preprocess_plate_for_ocr
from src.validation import validate_plate_format


def _safe_tesseract():
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def _clean_ocr_text(raw_text):
    if raw_text is None:
        return ""
    text = raw_text.strip().upper()
    text = text.replace("|", "I")
    text = re.sub(r"[^A-Z0-9 ]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_best_candidate(text):
    cleaned = _clean_ocr_text(text)
    compact = re.sub(r"\s+", "", cleaned)
    if not compact:
        return ""
    if validate_plate_format(compact)[0]:
        return validate_plate_format(compact)[1]
    if re.fullmatch(r"[A-Z0-9]{6,12}", compact):
        return compact
    return cleaned


def read_plate_text(plate_crop):
    if plate_crop is None:
        return {"status": "failed", "message": "Plate crop is empty.", "text": "", "confidence": 0.0, "raw": ""}

    if not _safe_tesseract():
        return {"status": "failed", "message": "Tesseract OCR is not installed or configured correctly.", "text": "", "confidence": 0.0, "raw": ""}

    processed = preprocess_plate_for_ocr(plate_crop)
    if processed is None:
        return {"status": "failed", "message": "Plate preprocessing failed.", "text": "", "confidence": 0.0, "raw": ""}

    config = "--psm 7 --oem 3"
    raw_result = pytesseract.image_to_string(processed, config=config)
    raw_text = raw_result.strip()

    if not raw_text:
        return {"status": "failed", "message": "OCR returned no text.", "text": "", "confidence": 0.0, "raw": ""}

    cleaned = _extract_best_candidate(raw_text)
    valid, final_plate = validate_plate_format(cleaned)
    if not valid and cleaned:
        final_plate = re.sub(r"[^A-Z0-9]", "", cleaned.upper())

    conf_data = pytesseract.image_to_data(processed, config=config, output_type=pytesseract.Output.DICT)
    conf_values = []
    for conf in conf_data.get("conf", []):
        try:
            val = int(float(conf))
            conf_values.append(val)
        except Exception:
            continue

    confidence = round(sum(conf_values) / len(conf_values), 2) if conf_values else 0.0

    return {
        "status": "success" if final_plate else "failed",
        "message": "OCR completed." if final_plate else "OCR result could not be validated.",
        "text": final_plate,
        "confidence": confidence,
        "raw": raw_text,
    }
