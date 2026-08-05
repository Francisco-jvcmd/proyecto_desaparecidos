import os
import base64
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def validar_cedula_ec(cedula: str) -> bool:
    """Valida cédula ecuatoriana según el algoritmo Módulo 10."""
    if len(cedula) != 10 or not cedula.isdigit():
        return False
        
    provincia = int(cedula[:2])
    if not ((1 <= provincia <= 24) or provincia == 30):
        return False
        
    tercer_digito = int(cedula[2])
    if tercer_digito > 5:
        return False
        
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    suma = 0
    for i in range(9):
        valor = int(cedula[i]) * coeficientes[i]
        if valor > 9:
            valor -= 9
        suma += valor
        
    digito_verificador = (10 - (suma % 10)) % 10
    return digito_verificador == int(cedula[9])

def encrypt_aes256(plaintext: str, key: bytes) -> str:
    """Cifra un texto plano utilizando AES-256-GCM."""
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")

def decrypt_aes256(ciphertext_b64: str, key: bytes) -> str:
    """Descifra un texto cifrado en base64 utilizando AES-256-GCM."""
    data = base64.b64decode(ciphertext_b64)
    nonce = data[:12]
    ciphertext = data[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")

def hash_password(password: str) -> str:
    """Hashea una contraseña utilizando Argon2."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Crea un token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_jwt_token(token: str) -> dict:
    """Decodifica y valida un token JWT."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
