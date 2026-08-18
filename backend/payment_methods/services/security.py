import hashlib
import hmac

from django.conf import settings


def normalize_identifier(identifier: str) -> str:
    return ''.join(identifier.split()).upper()


def hash_identifier(identifier: str) -> str:
    normalized = normalize_identifier(identifier)

    secret = settings.PAYMENT_IDENTIFIER_SECRET

    if not secret:
        raise RuntimeError(
            'PAYMENT_IDENTIFIER_SECRET is not configured.'
        )

    return hmac.new(
        secret.encode('utf-8'),
        normalized.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def get_last_four(identifier: str) -> str:
    normalized = normalize_identifier(identifier)

    return normalized[-4:]