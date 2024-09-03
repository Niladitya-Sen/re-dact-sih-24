import base64
import io
import spacy
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymupdf
import ocrmypdf
import re

app = Flask(__name__)
CORS(app, methods="*", origins="*")

nlp = spacy.load("en_core_web_trf")


@app.route("/redact", methods=["POST"])
def redact_text():
    pdf_file = request.files["pdf"]
    pdf_contents = pdf_file.read()

    pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")
    redactions = []

    email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    phone_pattern = re.compile(
        r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?(?:\d{1,4}[-.\s]?)?\d{1,4}[-.\s]?\d{1,9}"
    )

    for page_num, page in enumerate(pdf_document):
        page_text = page.get_text("dict")
        page_words = page_text["blocks"]

        for block in page_words:
            if block["type"] == 0:  # Text block
                for line in block["lines"]:
                    for span in line["spans"]:
                        # Get the bounding box and text
                        span_bbox = span["bbox"]
                        span_text = span["text"]

                        # Process text with spaCy
                        doc = nlp(span_text)
                        entities_to_redact = []

                        for entity in doc.ents:
                            if entity.label_ in [
                                "PERSON",
                                "ORG",
                                "DATE",
                                "TIME",
                                "MONEY",
                                "QUANTITY",
                                "ADDRESS",
                                "ACCOUNT_NUMBER",
                            ]:
                                entities_to_redact.append(entity.text)

                        # Add emails and phone numbers detected by regex
                        entities_to_redact.extend(re.findall(email_pattern, span_text))
                        entities_to_redact.extend(re.findall(phone_pattern, span_text))

                        for word in entities_to_redact:
                            if word.strip():
                                # Find the index of the word in the span text
                                word_start = span_text.find(word)
                                word_end = word_start + len(word)

                                # Calculate the proportion of the word within the span
                                span_length = len(span_text)
                                word_bbox_x1 = span_bbox[0] + (
                                    word_start / span_length
                                ) * (span_bbox[2] - span_bbox[0])
                                word_bbox_x2 = span_bbox[0] + (
                                    word_end / span_length
                                ) * (span_bbox[2] - span_bbox[0])
                                word_bbox_y1 = span_bbox[1]
                                word_bbox_y2 = span_bbox[3]

                                redactions.append(
                                    {
                                        "page": page_num,
                                        "text": word,
                                        "bbox": {
                                            "x": word_bbox_x1,
                                            "y": word_bbox_y1,
                                            "width": word_bbox_x2 - word_bbox_x1,
                                            "height": word_bbox_y2 - word_bbox_y1,
                                        },
                                    }
                                )

    return jsonify(redactions)

@app.route("/ocr", methods=["POST"])
def ocr_pdf():
    pdf_file = request.files["pdf"]
    pdf_contents = pdf_file.read()
    inputBuffer = io.BytesIO(pdf_contents)
    output = io.BytesIO()
    ocrmypdf.ocr(input_file=inputBuffer, output_file=output)
    output.seek(0)
    return jsonify({"pdf": base64.b64encode(output.read()).decode("utf-8")})


if __name__ == "__main__":
    app.run(debug=True)
