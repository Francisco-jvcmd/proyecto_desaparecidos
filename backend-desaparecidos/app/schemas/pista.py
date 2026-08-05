from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Literal


class PistaCreate(BaseModel):
    desaparecido_id: UUID
    descripcion: str = Field(min_length=10, max_length=2000)
    foto_url: str | None = None
    lat: float | None = Field(default=None, ge=-0.55, le=0.10)
    lng: float | None = Field(default=None, ge=-78.80, le=-78.20)


class PistaResponse(BaseModel):
    id: UUID
    desaparecido_id: UUID
    descripcion: str
    foto_url: str | None = None
    estado: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PistaModerar(BaseModel):
    estado: Literal["APROBADA", "DESCARTADA"]
