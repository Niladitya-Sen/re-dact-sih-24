import base64
import os
import tempfile
import cv2
import pytesseract
import numpy as np
from ultralytics import YOLO
from skimage.metrics import structural_similarity as compare_ssim
from concurrent.futures import ThreadPoolExecutor

# Load YOLOv8 model for face detection
face_model_path = "yolov8n-face.pt"
face_model = YOLO(face_model_path)


def blur_area(image, x, y, w, h, blur_level=300):
    """Blurs a specific area of the image."""
    if blur_level % 2 == 0:
        blur_level += 1
    ROI = image[y : y + h, x : x + w]
    if ROI.size == 0:
        return image
    blurred = cv2.GaussianBlur(ROI, (blur_level, blur_level), 0)
    image[y : y + h, x : x + w] = blurred
    return image


def blur_detected_text(image, cached_text_regions, extend_box=5):
    """Detects text using pytesseract and blurs the detected regions."""
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    text_data = pytesseract.image_to_data(
        gray_image, output_type=pytesseract.Output.DICT
    )

    for i in range(len(text_data["text"])):
        confidence = int(text_data["conf"][i])
        if confidence > 60:  # Only consider high-confidence text detections
            x = text_data["left"][i]
            y = text_data["top"][i]
            w = text_data["width"][i]
            h = text_data["height"][i]
            detected_text = text_data["text"][i].strip()

            if len(detected_text) > 0:
                cached_text_regions.append((x, y, w, h))

    # Blur all cached text regions
    for x, y, w, h in cached_text_regions:
        image = blur_area(
            image,
            x - extend_box,
            y - extend_box,
            w + 2 * extend_box,
            h + 2 * extend_box,
        )

    return image


def detect_faces(frame, resize_factor=0.5):
    """Detect faces using YOLOv8 with optional resizing."""
    resized_frame = cv2.resize(frame, (0, 0), fx=resize_factor, fy=resize_factor)
    results = face_model.predict(resized_frame, conf=0.40)

    detected_faces = []
    for result in results:
        for face in result.boxes.xyxy:
            x1, y1, x2, y2 = face
            x1, y1, x2, y2 = (
                int(x1 / resize_factor),
                int(y1 / resize_factor),
                int(x2 / resize_factor),
                int(y2 / resize_factor),
            )
            detected_faces.append((x1, y1, x2, y2))

    return detected_faces


def process_frame(frame, cached_text_regions):
    """Process a single frame to blur faces and text."""
    faces = detect_faces(frame, resize_factor=0.5)  # Faster detection with resizing
    for x1, y1, x2, y2 in faces:
        frame = blur_area(frame, x1, y1, x2 - x1, y2 - y1)

    # Blur detected text, using cached regions to prevent toggling
    frame = blur_detected_text(frame, cached_text_regions)

    return frame


def frame_similarity(frame1, frame2, threshold=0.95):
    """Calculate the similarity between two frames using SSIM."""
    gray_frame1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray_frame2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    score, _ = compare_ssim(gray_frame1, gray_frame2, full=True)
    return score >= threshold  # Returns True if frames are similar


def process_video(input_video_bytes, similarity_threshold=0.95, max_workers=4):
    """Process video to blur faces and text, skipping similar frames with multithreading."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_input_file:
            temp_input_file.write(input_video_bytes)
            temp_input_path = temp_input_file.name

        cap = cv2.VideoCapture(temp_input_path)

        if not cap.isOpened():
            raise ValueError("Error: Could not open video file")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_output_file:
            temp_output_path = temp_output_file.name

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(temp_output_path, fourcc, fps, (width, height))

        prev_frame = None
        cached_text_regions = []

        def process_and_write_frame(frame):
            """Process a frame and write it to the output video."""
            nonlocal prev_frame
            if prev_frame is not None and frame_similarity(
                prev_frame, frame, similarity_threshold
            ):
                out.write(prev_frame)
                return

            processed_frame = process_frame(frame, cached_text_regions)
            out.write(processed_frame)
            prev_frame = processed_frame

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                executor.submit(process_and_write_frame, frame)

        cap.release()
        out.release()

        with open(temp_output_path, "rb") as video_file:
            video_bytes = video_file.read()
            base64_encoded_video = base64.b64encode(video_bytes).decode("utf-8")

        return base64_encoded_video

    finally:
        os.remove(temp_input_path)
        if os.path.exists(temp_output_path):
            os.remove(temp_output_path)


# Example usage:
# with open("path_to_input_video.mp4", "rb") as video_file:
#     input_video_bytes = video_file.read()
#     base64_encoded_video = process_video(input_video_bytes)
#     # Use base64_encoded_video as needed
