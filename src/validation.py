import re


def normalize_plate_text(raw_text):
    if raw_text is None:
        return ""
    text = raw_text.strip().upper()
    text = re.sub(r"[\n\r\t]+", " ", text)
    text = re.sub(r"[^A-Z0-9]", "", text)
    return text


def validate_plate_format(text):
    normalized = normalize_plate_text(text)
    if re.fullmatch(r"^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$", normalized):
        return True, normalized
    if re.fullmatch(r"^[A-Z]{2}\d{2}[A-Z]{1,3}\d{1,4}$", normalized):
        return True, normalized
    return False, normalized
