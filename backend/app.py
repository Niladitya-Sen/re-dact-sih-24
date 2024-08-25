import base64
from cgitb import text
from pydoc import doc
import pytesseract
import os
from pdf2image import convert_from_path
import spacy
from flask import Flask, app, make_response, request, jsonify, send_file
from flask_cors import CORS
import pymupdf
import io

app = Flask(__name__)
CORS(app, methods="*", origins="*")

nlp = spacy.load("en_core_web_trf")


@app.route("/hygtfyft", methods=["GET"])
def redact():
    pdf_path = f"{os.path.dirname(__file__)}/pdf/test.pdf"

    images = convert_from_path(pdf_path)

    pdf = {}

    for page_number, page in enumerate(images):
        # Convert the page to grayscale
        gray_image = page.convert("L")

        pdf[page_number] = pytesseract.image_to_string(gray_image)

    doc = {}

    for page_number, text in pdf.items():
        doc[page_number] = nlp(text)

    for page_number, doc in doc.items():
        for entity in doc.ents:
            if entity.label_ in [
                "PERSON",
                "ORG",
                "GPE",
                "DATE",
                "TIME",
                "MONEY",
                "QUANTITY",
                "ORDINAL",
                "CARDINAL",
                "ADDRESS",
                "PHONE_NUMBER",
                "EMAIL",
                "ACCOUNT_NUMBER",
            ]:
                pdf[page_number] = pdf[page_number].replace(
                    entity.text, "█" * len(entity.text)
                )

    return jsonify(pdf)


@app.route("/redact", methods=["POST"])
def redact_text():
    pdf_file = request.files["pdf"]

    pdf_contents = pdf_file.read()

    pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")
    preview_document = pymupdf.open(stream=pdf_contents, filetype="pdf")

    text = ""

    for page in pdf_document:
        text += page.get_text("text")

    doc = nlp(text)

    words = []

    for entity in doc.ents:
        if entity.label_ in [
            "PERSON",
            "ORG",
            "GPE",
            "DATE",
            "TIME",
            "MONEY",
            "QUANTITY",
            "ORDINAL",
            "CARDINAL",
            "ADDRESS",
            "PHONE_NUMBER",
            "EMAIL",
            "ACCOUNT_NUMBER",
        ]:
            words.append(entity.text)

    light_blue = (173 / 255, 216 / 255, 230 / 255)

    for page in preview_document:
        for word in words:
            rects = page.search_for(word)
            for rect in rects:
                h = page.add_highlight_annot(rect)  # add highlight annotation
                h.set_colors(light_blue)
                h.set_opacity(0.5)
                h.update()

    for page in pdf_document:
        for word in words:
            rects = page.search_for(word)
            for rect in rects:
                page.add_redact_annot(
                    rect, text="", fill=(0, 0, 0)
                )  # add redaction annotation

        page.apply_redactions()

    pdf_buffer = io.BytesIO()
    preview_buffer = io.BytesIO()

    pdf_document.save(pdf_buffer)
    preview_document.save(preview_buffer)

    pdf_document.close()
    preview_document.close()

    pdf_buffer.seek(0)
    preview_buffer.seek(0)

    return jsonify(
        {
            "redacted": base64.b64encode(pdf_buffer.getvalue()).decode("utf-8"),
            "preview": base64.b64encode(preview_buffer.getvalue()).decode("utf-8"),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
