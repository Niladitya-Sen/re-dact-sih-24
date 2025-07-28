import base64
import io
import json
import os
import tempfile
import zipfile

import pyminizip
import pyzipper
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from regex import E
from services import document, image, video

load_dotenv()

PORT = int(os.getenv("PORT", 5000))
ENVIRONMENT = os.getenv("environment", "development")

app = Flask(__name__)
CORS(app, methods="*", origins="*")


@app.route("/api/redact", methods=["POST"])
def redact_text():
    pdf_file = request.files["pdf"]
    level = request.form.get("level")
    redactions = []
    if level != None:
        redactions = document.redact(pdf_file, level)
    else:
        redactions = document.redact(pdf_file, level="High")
    return jsonify(redactions)


@app.route("/api/redact-image", methods=["POST"])
def redact_image():
    image_file = request.files["image"]
    base64 = image.detect_and_blur_faces_and_text(image_file)
    return jsonify({"image": base64})


@app.route("/api/redact-pdf", methods=["POST"])
def redact_pdf():
    pdf_file = request.files["pdf"]
    words = json.loads(request.form["words"])
    base64 = document.redact_pdf(pdf_file, words)
    return jsonify({"pdf": base64})


@app.route("/api/redact-video", methods=["POST"])
def redact_video():
    video_file = request.files["video"]
    base64 = video.process_video(video_file.read())
    return jsonify({"video": base64})


@app.route("/api/ocr", methods=["POST"])
def ocr_pdf():
    pdf_file = request.files["pdf"]
    base64 = document.ocr(pdf_file)
    return jsonify({"pdf": base64})


@app.route("/api/zip", methods=["POST"])
def zip_files():
    # Get the list of files from the request
    uploaded_files = request.files.getlist(
        "files"
    )  # 'files' should be the key for multiple file inputs
    names = json.loads(request.form["name"])  # List of filenames
    password = request.form.get("password", "")  # Optional password for encryption
    compression_level = int(
        request.form.get("compression_level", "5")
    )  # Default compression level is 5

    # Create temporary files for each uploaded file
    file_paths = []
    file_names = []

    for index, uploaded_file in enumerate(uploaded_files):
        # Create a temporary file and write the uploaded file content
        temp_file = tempfile.NamedTemporaryFile(
            delete=False
        )  # Create a temporary file, don't delete on close
        temp_file.write(
            uploaded_file.read()
        )  # Write the uploaded file content to temp file
        temp_file.flush()  # Ensure the data is written to disk
        file_paths.append(temp_file.name)  # Store the temp file path for zipping
        file_names.append(names[index])  # Use the provided file names
        temp_file.close()  # Close the file, but don't delete it yet

    # Create a temporary file for the zip output
    with tempfile.NamedTemporaryFile(delete=False) as zip_temp_file:
        zip_output_path = zip_temp_file.name  # Store the temporary zip file path

    # Perform the zipping operation using pyminizip with optional password protection
    if len(password) == 0:
        pyminizip.compress_multiple(
            file_paths, None, file_names[0], "", compression_level
        )
    else:
        pyminizip.compress_multiple(
            file_paths, None, file_names[0], password, compression_level
        )

    # Read the zipped file and encode it in base64
    with open(zip_output_path, "rb") as zip_file:
        zip_base64 = base64.b64encode(zip_file.read()).decode("utf-8")

    # Clean up temporary files (both the individual files and the zip file)
    for temp_file in file_paths:
        os.remove(temp_file)  # Remove each temporary file after use
    os.remove(zip_output_path)  # Remove the temporary zip file
    os.remove(file_names[0])

    # Return the base64-encoded ZIP string
    return jsonify({"zip_base64": zip_base64})


if __name__ == "__main__":
    app.run(debug=ENVIRONMENT == "development", port=PORT)
