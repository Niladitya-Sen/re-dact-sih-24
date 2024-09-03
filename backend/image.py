import os
import cv2
import numpy as np
import pytesseract
from retinaface import RetinaFace  # Import RetinaFace for face detection


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


def detect_and_blur_faces_and_text(image_path, output_path="redacted_image.png"):
    # Read the input image
    image = cv2.imread(image_path)

    # Detect faces using RetinaFace
    faces = RetinaFace.detect_faces(image)

    for key, face in faces.items():
        # Get the face bounding box coordinates
        x1, y1, x2, y2 = face["facial_area"]
        w, h = x2 - x1, y2 - y1
        image = blur_area(image, x1, y1, w, h)

    # Use Tesseract to detect text areas
    text_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

    # Blur detected text areas
    for i in range(len(text_data["text"])):
        if int(text_data["conf"][i]) > 60:  # Confidence threshold to filter out noise
            x = text_data["left"][i]
            y = text_data["top"][i]
            w = text_data["width"][i]
            h = text_data["height"][i]
            if len(text_data["text"][i].strip()) > 0:  # Ensure non-empty text
                image = blur_area(image, x, y, w, h)

    # Save the redacted image
    cv2.imwrite(output_path, image)


# Provide the path to your image
image_path = f"{os.path.dirname(__file__)}/pdf/test6.jpg"
detect_and_blur_faces_and_text(image_path)
