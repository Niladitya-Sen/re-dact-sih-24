import io
import pymupdf
import spacy


nlp = spacy.load("en_core_web_trf")


class PDFService:
    document = None

    def __init__(self, stream):
        self.document = pymupdf.open(stream=stream, filetype="pdf")

    def get_redaction_words(self):
        text = ""

        for page in self.document:
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

        return words

    def redact(self, words):
        for page in self.document:
            for word in words:
                rects = page.search_for(word)
                for rect in rects:
                    page.add_redact_annot(
                        rect, text="", fill=(0, 0, 0)
                    )  # add redaction annotation
            page.apply_redactions()

        buffer = io.BytesIO()
        self.document.save(buffer)
        self.document.close()
        buffer.seek(0)
        return buffer

    def highlight(self, words, color):
        for page in self.document:
            for word in words:
                rects = page.search_for(word)
                for rect in rects:
                    h = page.add_highlight_annot(rect)  # add highlight annotation
                    h.set_colors(color)
                    h.set_opacity(0.5)
                    h.update()

        buffer = io.BytesIO()
        self.document.save(buffer)
        self.document.close()
        buffer.seek(0)
        return buffer
