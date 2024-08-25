from pydoc import doc
import pytesseract
import os
from pdf2image import convert_from_path
import spacy
import codecs

nlp = spacy.load("en_core_web_trf")

pdf_path = f"{os.path.dirname(__file__)}/pdf/test1.pdf"

images = convert_from_path(pdf_path)

text = ""

for page_number, page in enumerate(images):
    # Convert the page to grayscale
    gray_image = page.convert("L")

    # Use Tesseract to extract text from the image
    text += pytesseract.image_to_string(gray_image)


doc = nlp(text)

redacted_text = text

l = []

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
        redacted_text = redacted_text.replace(entity.text, "█" * len(entity.text))
        l.append(entity.text)

with codecs.open(f"{os.path.dirname(__file__)}/output.txt", "w", encoding="utf-8") as file:
    file.write(redacted_text)

print(l)