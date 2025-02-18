import spacy
import re

nlp = spacy.load("en_core_web_trf")

email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
phone_pattern = re.compile(r"^(?:\+91|91)?(?:\s*-*\s*)?(\d{10}|\d{11})$")
aadhaar_pattern = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")
pan_pattern = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
ip_pattern = re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")
ssn_pattern = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
credit_card_pattern = re.compile(r"\b(?:\d{4}[-.\s]?){3}\d{4}\b")
links_pattern = re.compile(r"https?://[^\s]+")

def get_words_to_redact(text):
    doc = nlp(text)
    
    words = set()

    regex_matches = []

    for ent in doc.ents:
        if ent.label_ in [
            "PERSON",
            "ORG",
            "GPE",
            "LOC",
            "DATE",
            "TIME",
            "PHONE_NUMBER",
            "ACCOUNT_NUMBER",
        ]:
            words.add(ent.text)

    regex_matches.extend(email_pattern.findall(text))
    regex_matches.extend(phone_pattern.findall(text))
    regex_matches.extend(aadhaar_pattern.findall(text))
    regex_matches.extend(pan_pattern.findall(text))
    regex_matches.extend(ip_pattern.findall(text))
    regex_matches.extend(ssn_pattern.findall(text))
    regex_matches.extend(credit_card_pattern.findall(text))
    regex_matches.extend(links_pattern.findall(text)) 

    words.update(regex_matches)

    return list(words)
