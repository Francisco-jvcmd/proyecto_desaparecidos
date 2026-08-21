import uuid
from datetime import datetime, date, time
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, Time, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import enum

from app.db.session import Base

class RolUsuario(str, enum.Enum):
    ADMIN = "ADMIN"
    FAMILIAR = "FAMILIAR"
    COMUNIDAD = "COMUNIDAD"

class EstadoCaso(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADO = "APROBADO"
    LOCALIZADO = "LOCALIZADO"
    ARCHIVADO = "ARCHIVADO"

class EstadoPista(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    DESCARTADA = "DESCARTADA"

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre_cifrado: Mapped[str] = mapped_column(String, nullable=False)
    email_cifrado: Mapped[str] = mapped_column(String, nullable=False)
    telefono_cifrado: Mapped[str] = mapped_column(String, nullable=False)
    cedula_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(SQLAlchemyEnum(RolUsuario), default=RolUsuario.FAMILIAR)
    google_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # === Campos LOPDP (Art. 8, 10i, 15) ===
    consentimiento_otorgado: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_consentimiento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), server_default=func.now())
    consentimiento_revocado: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_revocacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    motivo_revocacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    datos_eliminados: Mapped[bool] = mapped_column(Boolean, default=False)  # Art. 15 - soft delete
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    casos: Mapped[list["Desaparecido"]] = relationship(back_populates="reportante", lazy="selectin")
    pistas: Mapped[list["Pista"]] = relationship(back_populates="usuario", lazy="selectin")

class Desaparecido(Base):
    __tablename__ = "desaparecidos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombres: Mapped[str] = mapped_column(String, nullable=False)
    apellidos: Mapped[str] = mapped_column(String, nullable=False)
    cedula_desaparecido: Mapped[str | None] = mapped_column(String(10), nullable=True)
    edad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sexo: Mapped[str | None] = mapped_column(String, nullable=True)
    estatura_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    complexion: Mapped[str | None] = mapped_column(String, nullable=True)
    color_piel: Mapped[str | None] = mapped_column(String, nullable=True)
    color_cabello: Mapped[str | None] = mapped_column(String, nullable=True)
    ropa_descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    senas_particulares: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    fecha_desaparicion: Mapped[date] = mapped_column(Date, nullable=False)
    hora_aproximada: Mapped[time | None] = mapped_column(Time, nullable=True)
    
    punto_a = mapped_column(Geometry('POINT', srid=4326), nullable=False)
    punto_b = mapped_column(Geometry('POINT', srid=4326), nullable=True)
    
    parroquia_desaparicion: Mapped[str | None] = mapped_column(String, nullable=True)
    barrio: Mapped[str | None] = mapped_column(String, nullable=True)
    
    foto_url: Mapped[str | None] = mapped_column(String, nullable=True)
    afiche_url: Mapped[str | None] = mapped_column(String, nullable=True)
    estado: Mapped[EstadoCaso] = mapped_column(SQLAlchemyEnum(EstadoCaso), default=EstadoCaso.PENDIENTE)
    
    usuario_reportante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    consentimiento_firmado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    reportante: Mapped["Usuario"] = relationship(back_populates="casos", lazy="selectin")
    pistas: Mapped[list["Pista"]] = relationship(back_populates="desaparecido", lazy="selectin")

    @property
    def punto_a_lat(self) -> float:
        if self.punto_a is None:
            return 0.0
        try:
            from geoalchemy2.shape import to_shape
            return float(to_shape(self.punto_a).y)
        except Exception:
            return 0.0

    @property
    def punto_a_lng(self) -> float:
        if self.punto_a is None:
            return 0.0
        try:
            from geoalchemy2.shape import to_shape
            return float(to_shape(self.punto_a).x)
        except Exception:
            return 0.0

class Pista(Base):
    __tablename__ = "pistas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    desaparecido_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("desaparecidos.id"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    foto_url: Mapped[str | None] = mapped_column(String, nullable=True)
    ubicacion = mapped_column(Geometry('POINT', srid=4326), nullable=True)
    estado: Mapped[EstadoPista] = mapped_column(SQLAlchemyEnum(EstadoPista), default=EstadoPista.PENDIENTE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    desaparecido: Mapped["Desaparecido"] = relationship(back_populates="pistas", lazy="selectin")
    usuario: Mapped["Usuario"] = relationship(back_populates="pistas", lazy="selectin")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    accion: Mapped[str] = mapped_column(String, nullable=False)
    detalle = mapped_column(String, nullable=True) # Could use JSON but String handles json.dumps
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
