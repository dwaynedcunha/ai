import os
import time
from datetime import datetime

import cv2
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image

from src.database import load_history, save_detection_record
from src.detector import detect_number_plate
from src.ocr import read_plate_text
from src.validation import normalize_plate_text, validate_plate_format


PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "static", "uploads")
RESULT_DIR = os.path.join(PROJECT_ROOT, "static", "results")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)


st.set_page_config(page_title="ANPR Prototype", page_icon="🚗", layout="wide")


def generate_sample_plate_image():
    width, height = 900, 300
    canvas = np.full((height, width, 3), 255, dtype=np.uint8)
    cv2.rectangle(canvas, (50, 50), (850, 250), (0, 0, 0), 4)
    cv2.rectangle(canvas, (80, 80), (820, 220), (255, 255, 255), 3)
    cv2.putText(canvas, "MH 04 AB 1234", (120, 170), cv2.FONT_HERSHEY_SIMPLEX, 2.4, (0, 0, 0), 6, cv2.LINE_AA)
    return canvas


def draw_bbox(image, box):
    if image is None or box is None:
        return image
    x0, y0, x1, y1 = box
    output = image.copy()
    cv2.rectangle(output, (x0, y0), (x1, y1), (0, 255, 0), 3)
    return output


def format_result_text(raw_text):
    normalized = normalize_plate_text(raw_text)
    valid, final = validate_plate_format(normalized)
    if valid:
        return final
    if normalized:
        return normalized
    return ""


def save_uploaded_image(uploaded_file):
    filename = uploaded_file.name
    safe_name = filename.replace(" ", "_")
    save_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    return save_path


def main():
    st.title("Automatic Number Plate Recognition")
    st.caption("Deep Learning Based Vehicle Number Plate Detection")

    st.markdown("### Features")
    st.markdown("- Upload vehicle image\n- Preview original image\n- Detect number plate\n- Show detected bounding box\n- Show cropped plate and preprocessed plate\n- Run OCR\n- Display recognized number and confidence\n- Save result to CSV/Excel\n- Show historical detections")

    uploaded_file = st.file_uploader("Upload a vehicle image", type=["jpg", "jpeg", "png", "bmp"])
    use_demo = st.button("Generate demo plate image")

    if use_demo:
        demo_image = generate_sample_plate_image()
        demo_path = os.path.join(UPLOAD_DIR, "demo_plate.jpg")
        cv2.imwrite(demo_path, demo_image)
        st.session_state["demo_path"] = demo_path
        st.session_state["uploaded_file"] = None

    if "demo_path" in st.session_state and not uploaded_file:
        image_path = st.session_state["demo_path"]
        image = cv2.imread(image_path)
    elif uploaded_file is not None:
        image_path = save_uploaded_image(uploaded_file)
        image = cv2.imread(image_path)
    else:
        image = None

    history_df = load_history()

    if image is not None:
        start_time = time.time()
        detection = detect_number_plate(image)
        processing_time = round(time.time() - start_time, 2)

        if detection.get("status") == "failed":
            st.error(detection.get("message", "No number plate detected."))
            st.info("Detection Status: Failed\nOCR Status: Not run\nProcessing Time: {} seconds".format(processing_time))
        else:
            crop = detection.get("crop")
            if crop is None:
                st.error("No number plate detected.")
            else:
                plate_result = read_plate_text(crop)
                final_plate = format_result_text(plate_result.get("text", ""))
                detection_status = "Successful"
                ocr_status = "Successful" if plate_result.get("status") == "success" else "Failed"

                original_with_box = draw_bbox(image, detection.get("box"))
                grayscale_plate = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                processed_display = cv2.cvtColor(grayscale_plate, cv2.COLOR_GRAY2RGB)

                st.subheader("Vehicle Image")
                st.image(original_with_box, channels="BGR", use_container_width=True)

                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.subheader("Detected Plate")
                    st.image(crop, channels="BGR", use_container_width=True)
                with col2:
                    st.subheader("Cropped Plate")
                    st.image(crop, channels="BGR", use_container_width=True)
                with col3:
                    st.subheader("Preprocessed Plate")
                    st.image(processed_display, use_container_width=True)
                with col4:
                    st.subheader("OCR Result")
                    if final_plate:
                        st.markdown(f"<h2 style='color:green'>{final_plate}</h2>", unsafe_allow_html=True)
                    else:
                        st.warning("No valid plate detected.")

                st.markdown("---")
                st.markdown(f"**Detection Status:** {detection_status}")
                st.markdown(f"**OCR Status:** {ocr_status}")
                st.markdown(f"**Processing Time:** {processing_time} seconds")
                st.markdown(f"**Confidence:** {plate_result.get('confidence', 0.0)}%")

                if final_plate:
                    record = {
                        "Date": datetime.now().strftime("%d-%m-%Y"),
                        "Time": datetime.now().strftime("%H:%M:%S"),
                        "DetectedNumberPlate": final_plate,
                        "OCRConfidence": plate_result.get("confidence", 0.0),
                        "ImageFilename": uploaded_file.name if uploaded_file else os.path.basename(st.session_state.get("demo_path", "demo_plate.jpg")),
                        "DetectionStatus": detection_status,
                        "OCRStatus": ocr_status,
                        "ProcessingTimeSeconds": processing_time,
                        "Detector": detection.get("detector", "opencv"),
                    }
                    save_detection_record(record)
                    st.success("Result saved to CSV/Excel file.")

    st.subheader("History")
    if history_df.empty:
        st.info("No previous detections yet.")
    else:
        # show only recent records
        st.dataframe(history_df.tail(10), use_container_width=True)


if __name__ == "__main__":
    main()
