import re

FILLER_WORDS = {
    "à",
    "ừm",
    "ờ",
    "thì",
    "mà",
    "là",
    "uhm",
    "ah",
}


def clean_lyrics(raw_text: str) -> str:
    text = raw_text or ""

    # Remove specific punctuation requested in FR-04.
    text = re.sub(r"[\.,!\?@#]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return ""

    tokens = text.split(" ")
    cleaned_tokens = [token for token in tokens if token.lower() not in FILLER_WORDS]

    return " ".join(cleaned_tokens).strip()