import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash


ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 30
password_hash = PasswordHash.recommended()
dummy_password_hash = password_hash.hash(secrets.token_urlsafe(32))


def get_signing_key() -> str:
    key = os.getenv("RESOLVECAMPUS_SECRET_KEY")
    if not key or len(key) < 32:
        raise RuntimeError("RESOLVECAMPUS_SECRET_KEY must contain at least 32 characters")
    return key


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)


def verify_unknown_user_password(password: str) -> None:
    password_hash.verify(password, dummy_password_hash)


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, get_signing_key(), algorithm=ALGORITHM)