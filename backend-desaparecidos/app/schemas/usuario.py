from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Literal
from uuid import UUID
from datetime import datetime
import re

from app.core.security import validar_cedula_ec

class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    telefono: str
    cedula: str
    password: str = Field(min_length=8)

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, v: str) -> str:
        if not re.match(r"^09\d{8}$", v):
            raise ValueError("El teléfono debe tener formato ecuatoriano (ej. 0991234567)")
        return v

    @field_validator("cedula")
    @classmethod
    def validate_cedula(cls, v: str) -> str:
        if not validar_cedula_ec(v):
            raise ValueError("La cédula ingresada no es válida.")
        return v

class UsuarioLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str

class RegistroResponse(BaseModel):
    message: str
    email: str
    requiere_verificacion: bool = True

class VerificarEmailRequest(BaseModel):
    token: str

class ReenviarEmailRequest(BaseModel):
    email: EmailStr

class VerificarEmailResponse(BaseModel):
    message: str
    access_token: str | None = None
    token_type: str = "bearer"
    rol: str | None = None

class UsuarioResponse(BaseModel):
    id: UUID
    nombre: str
    email: str
    rol: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SolicitarResetPasswordRequest(BaseModel):
    email: EmailStr

class RestablecerPasswordRequest(BaseModel):
    token: str
    nueva_password: str = Field(min_length=8)

