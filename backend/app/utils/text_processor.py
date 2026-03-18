import re

FILLER_WORDS = {
    "à",
    "á",
    "ạ",
    "ơ",
    "ừm",
    "ừ",
    "ừh",
    "ờ",
    "ờm",
    "thì",
    "mà",
    "là",
    "như",
    "kiểu",
    "nha",
    "nhé",
    "ha",
    "uhm",
    "um",
    "uh",
    "ah",
}


def clean_lyrics(raw_text: str) -> str:
    text = raw_text or ""

    # Keep unicode letters/numbers/spaces and remove special characters.
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return ""

    tokens = text.split(" ")
    cleaned_tokens = [token for token in tokens if token.casefold() not in FILLER_WORDS]

    return " ".join(cleaned_tokens).strip()