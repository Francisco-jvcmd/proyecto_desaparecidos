from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import date, time, datetime
from typing import Literal
from uuid import UUID

from app.core.security import validar_cedula_ec
from app.db.models import EstadoCaso

class DesaparecidoBase(BaseModel):
    nombres: str = Field(min_length=2, max_length=100)
    apellidos: str = Field(min_length=2, max_length=100)
    cedula_desaparecido: str = Field(min_length=10, max_length=10)
    edad: int = Field(ge=0, le=120)
    sexo: Literal["MASCULINO", "FEMENINO", "OTRO"]
    estatura_cm: float | None = Field(default=None, ge=30.0, le=250.0)
    complexion: str | None = None
    color_piel: str | None = None
    color_cabello: str | None = None
    ropa_descripcion: str | None = Field(default=None, max_length=1000)
    senas_particulares: str | None = Field(default=None, max_length=1000)
    
    fecha_desaparicion: date
    hora_aproximada: time | None = None
    
    punto_a_lat: float = Field(ge=-0.55, le=0.10)
    punto_a_lng: float = Field(ge=-78.80, le=-78.20)
    
    parroquia_desaparicion: str | None = None
    barrio: str | None = None
    foto_url: str | None = None

    @field_validator("cedula_desaparecido")
    @classmethod
    def validate_cedula(cls, v: str) -> str:
        if not validar_cedula_ec(v):
            raise ValueError("La cédula ingresada no es válida según el Módulo 10.")
        return v

    @field_validator("fecha_desaparicion")
    @classmethod
    def validate_fecha(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("La fecha de desaparición no puede estar en el futuro.")
        return v

class ReportarCasoRequest(DesaparecidoBase):
    consentimiento_firmado: Literal[True]

class DesaparecidoCreate(DesaparecidoBase):
    consentimiento_firmado: Literal[True]
    cedula_denunciante: str

    @field_validator("cedula_denunciante")
    @classmethod
    def validate_cedula_denunciante(cls, v: str) -> str:
        if not validar_cedula_ec(v):
            raise ValueError("La cédula del denunciante no es válida.")
        return v

class DesaparecidoResponse(DesaparecidoBase):
    id: UUID
    estado: str
    foto_url: str | None = None
    afiche_url: str | None = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DesaparecidoPublico(BaseModel):
    id: UUID
    nombres: str
    apellidos: str
    edad: int
    sexo: str
    fecha_desaparicion: date
    punto_a_lat: float
    punto_a_lng: float
    parroquia_desaparicion: str | None = None
    barrio: str | None = None
    ropa_descripcion: str | None = None
    senas_particulares: str | None = None
    foto_url: str | None = None
    afiche_url: str | None = None
    estado: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DesaparecidoAdminUpdate(BaseModel):
    estado: EstadoCaso
    punto_b_lat: float | None = None
    punto_b_lng: float | None = None
