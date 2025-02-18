TRAIN_DATA = [
    ("Who is Nishanth?", {"entities": [(7, 15, "PERSON")]}),
    ("Who is Kamal Khumar?", {"entities": [(7, 19, "PERSON")]}),
    ("I like London and Berlin.", {"entities": [(7, 13, "LOC"), (18, 24, "LOC")]}),
    ("Phone number is 1234567890", {"entities": [(16, 26, "PHONE_NUMBER")]}),
    ("Phone number is +91 1234567890", {"entities": [(16, 30, "PHONE_NUMBER")]}),
    ("My email is abcd@gmail.com", {"entities": [(12, 26, "EMAIL")]}),
    ("Email is alexjohn789@gmail.com", {"entities": [(9, 30, "EMAIL")]}),
    ("Email is alex.568@outlook.com", {"entities": [(9, 29, "EMAIL")]}),
    ("My email is john.smith@yahoo.com", {"entities": [(12, 32, "EMAIL")]}),
]

# Convert to spaCy's Example format
import os
import random
import spacy
from spacy.training import Example

nlp = spacy.blank("en")  # Create a blank model

print(spacy.training.offsets_to_biluo_tags(nlp.make_doc(TRAIN_DATA[4][0]), TRAIN_DATA[4][1]["entities"]), TRAIN_DATA[4][0][16:29])

# Add the NER component
if "ner" not in nlp.pipe_names:
    ner = nlp.add_pipe("ner")
else:
    ner = nlp.get_pipe("ner")

# Add new labels
labels = [
    "NAME",
    "PASSWORD",
    "EMAIL",
    "PHONE_NUMBER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "ADDRESS",
    "ORGANIZATION",
    "VIN",
    "SSN",
    "IMEI",
    "IMSI",
    "AADHAAR_NUMBER",
    "PAN_CARD",
    "DRIVERS_LICENSE",
    "MAC_ADDRESS",
    "IPV4_ADDRESS",
    "IPV6_ADDRESS",
    "AMOUNT",
    "ID",
]
for label in labels:
    ner.add_label(label)

# Create training examples
training_examples = []
for text, annotations in TRAIN_DATA:
    doc = nlp.make_doc(text)
    example = Example.from_dict(doc, annotations)
    training_examples.append(example)

# Train the model
op = nlp.begin_training()
for epoch in range(100):
    random.shuffle(TRAIN_DATA)
    losses = {}
    for example in training_examples:
        nlp.update([example], drop=0.5, losses=losses, sgd=op)
    print(f"Epoch {epoch} - Losses: {losses}")

# Save the model
nlp.to_disk(f"{os.path.dirname(__file__)}/models/ner_model")
