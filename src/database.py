import os
from datetime import datetime

import pandas as pd

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "output")
CSV_PATH = os.path.join(OUTPUT_DIR, "detections.csv")
EXCEL_PATH = os.path.join(OUTPUT_DIR, "detections.xlsx")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def save_detection_record(record):
    ensure_output_dir()
    columns = [
        "Date",
        "Time",
        "DetectedNumberPlate",
        "OCRConfidence",
        "ImageFilename",
        "DetectionStatus",
        "OCRStatus",
        "ProcessingTimeSeconds",
        "Detector",
    ]
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
    else:
        df = pd.DataFrame(columns=columns)

    row = {
        "Date": record.get("Date", datetime.now().strftime("%d-%m-%Y")),
        "Time": record.get("Time", datetime.now().strftime("%H:%M:%S")),
        "DetectedNumberPlate": record.get("DetectedNumberPlate", ""),
        "OCRConfidence": record.get("OCRConfidence", 0.0),
        "ImageFilename": record.get("ImageFilename", ""),
        "DetectionStatus": record.get("DetectionStatus", "Unknown"),
        "OCRStatus": record.get("OCRStatus", "Unknown"),
        "ProcessingTimeSeconds": record.get("ProcessingTimeSeconds", 0.0),
        "Detector": record.get("Detector", "Unknown"),
    }

    df = pd.concat([df, pd.DataFrame([row], columns=columns)], ignore_index=True)
    df.to_csv(CSV_PATH, index=False)
    try:
        df.to_excel(EXCEL_PATH, index=False)
    except Exception:
        pass
    return CSV_PATH


def load_history():
    if not os.path.exists(CSV_PATH):
        return pd.DataFrame(columns=[
            "Date",
            "Time",
            "DetectedNumberPlate",
            "OCRConfidence",
            "ImageFilename",
            "DetectionStatus",
            "OCRStatus",
            "ProcessingTimeSeconds",
            "Detector",
        ])
    return pd.read_csv(CSV_PATH)
