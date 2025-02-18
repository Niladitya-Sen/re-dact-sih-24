import base64
import io

import cv2
import numpy as np
import pytesseract
from ultralytics import YOLO
from services import text

face_model_path = "yolov8n-face.pt"
face_model = YOLO(face_model_path)


def blur_area(image, x, y, w, h, blur_level=300):
    """Blurs a specific area of the image"""
    # Ensure blur_level is an odd number
    if blur_level % 2 == 0:
        blur_level += 1

    # Extract the region of interest
    ROI = image[y : y + h, x : x + w]

    # Apply Gaussian Blur to the ROI
    blurred = cv2.GaussianBlur(ROI, (blur_level, blur_level), 0)

    # Place the blurred ROI back into the image
    image[y : y + h, x : x + w] = blurred
    return image


def detect_and_blur_faces_and_text(image_file):
    # Read the input image
    image = cv2.imdecode(np.frombuffer(image_file.read(), np.uint8), cv2.IMREAD_COLOR)

    # Detect faces using RetinaFace
    # faces = RetinaFace.detect_faces(image)

    results = face_model.predict(image, conf=0.40)

    for result in results:
        for face in result.boxes.xyxy:
            x1, y1, x2, y2 = face
            w, h = int(x2) - int(x1), int(y2) - int(y1)
            image = blur_area(image, int(x1), int(y1), w, h)

    # Use Tesseract to detect text areas
    text_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

    t = " ".join(text_data["text"])

    print("Extracted Text", t, end="\n\n")

    words = text.get_words_to_redact(t)

    t = " ".join(words)

    print("Words for Redaction", t, end="\n\n")

    # Blur detected text areas
    for i in range(len(text_data["text"])):
        if (
            text_data["text"][i] in t and int(text_data["conf"][i]) > 60
        ):  # Confidence threshold to filter out noise
            x = text_data["left"][i]
            y = text_data["top"][i]
            w = text_data["width"][i]
            h = text_data["height"][i]
            if len(text_data["text"][i].strip()) > 0:  # Ensure non-empty text
                image = blur_area(image, x, y, w, h)

    # Save the redacted image
    _, buffer = cv2.imencode(".jpg", image)
    output = io.BytesIO(buffer)
    output.seek(0)

    return base64.b64encode(output.getvalue()).decode("utf-8")
