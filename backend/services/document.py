import base64
import io
import re

import ocrmypdf
import pymupdf
import spacy
import fitz

nlp = spacy.load("en_core_web_trf")

# Define regex patterns for custom categories
email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
phone_pattern = re.compile(r"(?:\+91|91)?\s*-*\s*[6-9]\d{9}")
aadhaar_pattern = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")
pan_pattern = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
ip_pattern = re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")
ssn_pattern = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
credit_card_pattern = re.compile(r"\b(?:\d{4}[-.\s]?){3}\d{4}\b")
links_pattern = re.compile(r"https?://[^\s]+")
alphanumeric_pattern = re.compile(
    r"^(?!.*\b(?:\d{1,2}/\d{1,2}/\d{2,4}|\d{4}-\d{2}-\d{2})\b)(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{2,}$"
)


# Custom categories for redaction
custom_categories = {
    "Names": ["PERSON"],
    "Credentials": [
        "Aadhaar Numbers",
        "PAN Numbers",
        "SSNs",
        "Credit Cards",
        "Alphanumeric",
    ],
    "Dates": ["DATE", "TIME"],
    "Addresses": ["ADDRESS", "GPE", "LOC"],
    "IPs": ["IPs"],
    "Phone Numbers": ["Phone Numbers"],
    "Account Numbers": ["ACCOUNT_NUMBER"],
    "Organization": ["ORG"],
}

levels = {
    "Low": ["Names", "Dates", "Addresses", "Account Numbers", "Phone Numbers"],
    "Medium": [
        "Names",
        "Dates",
        "Addresses",
        "Phone Numbers",
        "Organization",
        "Credentials",
        "Account Numbers",
    ],
    "High": [
        "Names",
        "Dates",
        "Addresses",
        "Phone Numbers",
        "Organization",
        "Credentials",
        "Account Numbers",
    ],
}


def redact(pdf_file, level="High"):
    if level == "Low":
        return low_redact(pdf_file)
    elif level == "Medium":
        return medium_redact(pdf_file)
    elif level == "High":
        return high_redact(pdf_file)


def low_redact(pdf_file):
    pdf_contents = pdf_file.read()

    pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")
    redactions = []

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
                            for category in levels["Low"]:
                                if entity.label_ in custom_categories[category]:
                                    entities_to_redact.append(
                                        {"text": entity.text, "category": category}
                                    )

                        # Add regex-based redactions for emails, phone numbers, etc.
                        if re.findall(email_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Emails"}
                            )
                        elif re.findall(phone_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Phone Numbers"}
                            )
                        elif re.findall(aadhaar_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Aadhaar Number"}
                            )
                        elif re.findall(pan_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "PAN Number"}
                            )

                        # Add redaction details with category
                        for entity in entities_to_redact:
                            if entity["text"].strip():
                                # Find the index of the word in the span text
                                word_start = span_text.find(entity["text"])
                                word_end = word_start + len(entity["text"])

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

                                # Append the redaction with category
                                redactions.append(
                                    {
                                        "page": page_num,
                                        "text": entity["text"],
                                        "category": entity["category"],
                                        "bbox": {
                                            "x": word_bbox_x1,
                                            "y": word_bbox_y1,
                                            "width": word_bbox_x2 - word_bbox_x1,
                                            "height": word_bbox_y2 - word_bbox_y1,
                                        },
                                    }
                                )
    return redactions


def high_redact(pdf_file):
    pdf_contents = pdf_file.read()

    pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")
    redactions = []

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
                            for category in levels["High"]:
                                if entity.label_ in custom_categories[category]:
                                    entities_to_redact.append(
                                        {"text": entity.text, "category": category}
                                    )

                        # Add regex-based redactions for emails, phone numbers, etc.
                        if re.findall(email_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Emails"}
                            )
                        elif re.findall(phone_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Phone Numbers"}
                            )
                        elif re.findall(aadhaar_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Aadhaar Number"}
                            )
                        elif re.findall(pan_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "PAN Number"}
                            )
                        elif re.findall(ip_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "IP Address"}
                            )
                        elif re.findall(ssn_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "SSN"}
                            )
                        elif re.findall(credit_card_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Credit or Debit Card"}
                            )
                        elif re.findall(links_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Links"}
                            )
                        elif re.findall(alphanumeric_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Credentials"}
                            )

                        # Add redaction details with category
                        for entity in entities_to_redact:
                            if entity["text"].strip():
                                # Find the index of the word in the span text
                                word_start = span_text.find(entity["text"])
                                word_end = word_start + len(entity["text"])

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

                                # Append the redaction with category
                                redactions.append(
                                    {
                                        "page": page_num,
                                        "text": entity["text"],
                                        "category": entity["category"],
                                        "bbox": {
                                            "x": word_bbox_x1,
                                            "y": word_bbox_y1,
                                            "width": word_bbox_x2 - word_bbox_x1,
                                            "height": word_bbox_y2 - word_bbox_y1,
                                        },
                                    }
                                )
    return redactions


def medium_redact(pdf_file):
    pdf_contents = pdf_file.read()

    pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")
    redactions = []

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
                            for category in levels["Medium"]:
                                if entity.label_ in custom_categories[category]:
                                    entities_to_redact.append(
                                        {"text": entity.text, "category": category}
                                    )

                        # Add regex-based redactions for emails, phone numbers, etc.
                        if re.findall(email_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Emails"}
                            )
                        elif re.findall(phone_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Phone Numbers"}
                            )
                        elif re.findall(aadhaar_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Aadhaar Number"}
                            )
                        elif re.findall(pan_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "PAN Number"}
                            )
                        elif re.findall(credit_card_pattern, span_text):
                            entities_to_redact.append(
                                {"text": span_text, "category": "Credit or Debit Card"}
                            )

                        # Add redaction details with category
                        for entity in entities_to_redact:
                            if entity["text"].strip():
                                # Find the index of the word in the span text
                                word_start = span_text.find(entity["text"])
                                word_end = word_start + len(entity["text"])

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

                                # Append the redaction with category
                                redactions.append(
                                    {
                                        "page": page_num,
                                        "text": entity["text"],
                                        "category": entity["category"],
                                        "bbox": {
                                            "x": word_bbox_x1,
                                            "y": word_bbox_y1,
                                            "width": word_bbox_x2 - word_bbox_x1,
                                            "height": word_bbox_y2 - word_bbox_y1,
                                        },
                                    }
                                )
    return redactions


# def redact_pdf(pdf_file, words):
#     pdf_contents = pdf_file.read()
#     pdf_document = pymupdf.open(stream=pdf_contents, filetype="pdf")

#     for word in words:
#         rect = pymupdf.Rect(
#             x0=word["pdfBbox"]["x"],
#             y0=word["pdfBbox"]["y"],
#             x1=word["pdfBbox"]["width"] + word["pdfBbox"]["x"],
#             y1=word["pdfBbox"]["height"] + word["pdfBbox"]["y"],
#         )

#         pdf_document[word["page"]].add_redact_annot(rect, fill=(0, 0, 0), text="")
#         pdf_document[word["page"]].apply_redactions()

#     output = io.BytesIO()
#     pdf_document.save(
#         filename=output,
#         encryption=pymupdf.PDF_ENCRYPT_AES_256,
#         owner_pw="1234",
#         user_pw="1234",
#         permissions=(
#             pymupdf.PDF_PERM_ACCESSIBILITY  # always use this
#             | pymupdf.PDF_PERM_PRINT  # permit printing
#             | pymupdf.PDF_PERM_COPY  # permit copying
#             | pymupdf.PDF_PERM_ANNOTATE  # permit adding annotations
#         ),
#     )
#     pdf_document.close()
#     output.seek(0)

#     return base64.b64encode(output.getvalue()).decode("utf-8")


def redact_pdf(pdf_file, words):
    try:
        # Read the contents of the PDF file
        pdf_contents = pdf_file.read()

        # Open the PDF document from the stream
        pdf_document = fitz.open(stream=pdf_contents, filetype="pdf")

        for word in words:
            # Calculate the rectangle for redaction using bounding box coordinates
            rect = fitz.Rect(
                word["pdfBbox"]["x"],  # x0
                word["pdfBbox"]["y"],  # y0
                word["pdfBbox"]["width"] + word["pdfBbox"]["x"],  # x1
                word["pdfBbox"]["height"] + word["pdfBbox"]["y"],  # y1
            )

            # Add a redaction annotation on the specified page
            page = pdf_document[word["page"]]
            page.add_redact_annot(rect, fill=(0, 0, 0))  # Redaction fill color: black
            page.apply_redactions()  # Apply the redaction to the page

        # Save the redacted PDF with encryption
        output = io.BytesIO()  # Save to memory
        pdf_document.save(
            output,  # Output to the BytesIO object
        )
        pdf_document.close()

        # Seek to the start of the output and encode the PDF as base64
        output.seek(0)
        return base64.b64encode(output.getvalue()).decode("utf-8")

    except Exception as e:
        print(f"Error: {e}")
        return None


def ocr(pdf_file):
    pdf_contents = pdf_file.read()
    inputBuffer = io.BytesIO(pdf_contents)
    output = io.BytesIO()
    ocrmypdf.ocr(input_file=inputBuffer, output_file=output)
    output.seek(0)
    return base64.b64encode(output.read()).decode("utf-8")
