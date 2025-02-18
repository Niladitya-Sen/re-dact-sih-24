import spacy
import os
# Load the trained model from the specified path
model_path = os.path.join(os.path.dirname(__file__), "models/ner_model")
nlp = spacy.load(model_path)

# Example usage
text = "What is your name? My name is John Doe. My email is john.doe@outlook.com. My phone number is 7855694125. I am from Boston."
doc = nlp(text)

print(doc.ents)

# Print recognized entities
for ent in doc.ents:
    print(ent.text, ent.label_)
