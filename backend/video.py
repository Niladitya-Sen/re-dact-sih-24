import os
import cv2
import numpy as np
import pytesseract

# Load the pre-trained deep learning model for face detection
prototxt_path = f"{os.path.dirname(__file__)}/deploy.prototxt.txt"  # Path to the deploy.prototxt file
model_path = f"{os.path.dirname(__file__)}/res10_300x300_ssd_iter_140000.caffemodel"  # Path to the caffemodel file
net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)


def blur_area(image, x, y, w, h, blur_level=15):
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


def process_frame(frame):
    """Process a single frame to blur faces and text"""
    (h, w) = frame.shape[:2]

    # Prepare the image for deep learning face detection
    blob = cv2.dnn.blobFromImage(
        cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0)
    )
    net.setInput(blob)
    detections = net.forward()

    # Iterate over detected faces and blur them
    for i in range(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]

        # Filter out weak detections based on confidence threshold
        if confidence > 0.5:  # Confidence threshold can be adjusted
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (startX, startY, endX, endY) = box.astype("int")

            # Blur the detected face
            frame = blur_area(frame, startX, startY, endX - startX, endY - startY)

    # Use Tesseract to detect text areas
    text_data = pytesseract.image_to_data(frame, output_type=pytesseract.Output.DICT)

    # Blur detected text areas
    for i in range(len(text_data["text"])):
        if int(text_data["conf"][i]) > 60:  # Confidence threshold to filter out noise
            x = text_data["left"][i]
            y = text_data["top"][i]
            w = text_data["width"][i]
            h = text_data["height"][i]
            if len(text_data["text"][i].strip()) > 0:  # Ensure non-empty text
                frame = blur_area(frame, x, y, w, h)

    return frame


def process_video(input_video_path, output_video_path="redacted_video.mp4"):
    # Open the video file
    cap = cv2.VideoCapture(input_video_path)

    if not cap.isOpened():
        print(f"Error: Could not open video file {input_video_path}")
        return

    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Create VideoWriter object
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")  # Codec for .mp4 format
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    while True:
        # Read each frame from the video
        ret, frame = cap.read()
        if not ret:
            break

        # Process the frame
        processed_frame = process_frame(frame)

        # Write the processed frame to the output video
        out.write(processed_frame)

    # Release resources
    cap.release()
    out.release()
    cv2.destroyAllWindows()


# Provide the path to your video
input_video_path = f"{os.path.dirname(__file__)}/pdf/test1.mp4"
process_video(input_video_path)
