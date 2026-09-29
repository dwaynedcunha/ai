import argparse
import os

import pandas as pd

from src.detector import detect_number_plate
from src.ocr import read_plate_text
from src.validation import normalize_plate_text


def evaluate_dataset(images_dir, labels_csv):
    labels_df = pd.read_csv(labels_csv)
    total = len(labels_df)
    detection_success = 0
    ocr_success = 0
    exact_success = 0
    failures = []

    for _, row in labels_df.iterrows():
        filename = row["filename"]
        expected = normalize_plate_text(str(row["plate"]))
        image_path = os.path.join(images_dir, filename)
        if not os.path.exists(image_path):
            failures.append((filename, "missing-image"))
            continue

        import cv2
        image = cv2.imread(image_path)
        if image is None:
            failures.append((filename, "invalid-image"))
            continue

        detection = detect_number_plate(image)
        if detection.get("status") == "success":
            detection_success += 1
            crop = detection.get("crop")
            ocr_result = read_plate_text(crop)
            plate_text = normalize_plate_text(ocr_result.get("text", ""))
            if plate_text:
                ocr_success += 1
            if plate_text == expected:
                exact_success += 1
        else:
            failures.append((filename, "no-detection"))

    detection_accuracy = (detection_success / total) * 100 if total else 0.0
    ocr_accuracy = (ocr_success / total) * 100 if total else 0.0
    exact_accuracy = (exact_success / total) * 100 if total else 0.0

    print("Evaluation Summary")
    print(f"Total images: {total}")
    print(f"Successful detections: {detection_success}")
    print(f"Failed detections: {total - detection_success}")
    print(f"Detection accuracy: {detection_accuracy:.2f}%")
    print(f"OCR accuracy: {ocr_accuracy:.2f}%")
    print(f"Exact plate recognition accuracy: {exact_accuracy:.2f}%")
    if failures:
        print("Failures:")
        for item in failures:
            print(" -", item)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate ANPR detection and OCR on labeled vehicle images.")
    parser.add_argument("--images", required=True, help="Folder containing labeled vehicle images.")
    parser.add_argument("--labels", required=True, help="CSV file with columns filename,plate.")
    args = parser.parse_args()
    evaluate_dataset(args.images, args.labels)
