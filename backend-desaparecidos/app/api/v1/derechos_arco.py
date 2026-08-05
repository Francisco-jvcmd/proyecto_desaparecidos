"""
Módulo de Derechos ARCO — LOPDP Ecuador (R.O. 459, 26-may-2021)

Implementa los derechos del titular según:
- Art. 13: Derecho de Acceso
- Art. 14: Derecho de Rectificación y Actualización
- Art. 15: Derecho de Eliminación
- Art. 16: Derecho de Oposición
- Art. 17: Derecho de Portabilidad
- Art. 8:  Revocación de Consentimiento

Todos los endpoints requieren autenticación JWT.
Plazo legal de respuesta: 15 días (Art. 13-16).
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field
from typing import Optional
import uuid
import json
import datetime

from app.api.deps import get_db, get_current_user
from app.db.models import Usuario, Desaparecido, Pista, AuditLog
from app.core.config import get_settings
from app.core.security import decrypt_aes256, encrypt_aes256

router = APIRouter(prefix="/derechos", tags=["Derechos ARCO - LOPDP"])

settings = get_settings()
aes_key = bytes.fromhex(settings.AES_KEY)


# ============================================================
# Schemas específicos para ARCO
# ============================================================

class DatosPersonalesResponse(BaseModel):
    """Respuesta al derecho de acceso (Art. 13) — datos descifrados del titular."""
    nombre: str
    email: str
    telefono: str
    rol: str
    is_active: bool
    consentimiento_otorgado: bool
    fecha_consentimiento: Optional[datetime.datetime] = None
    consentimiento_revocado: bool
    fecha_revocacion: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    casos_registrados: int
    pistas_enviadas: int
    # Metadatos Art. 12 (17 puntos)
    informacion_tratamiento: dict


class RectificacionRequest(BaseModel):
    """Solicitud de rectificación (Art. 14)."""
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[str] = None
    telefono: Optional[str] = None


class EliminacionRequest(BaseModel):
    """Solicitud de eliminación (Art. 15)."""
    motivo: str = Field(min_length=10, max_length=500, description="Motivo de la solicitud de eliminación")
    confirmar: bool = Field(description="Confirmación explícita de eliminación")


class OposicionRequest(BaseModel):
    """Solicitud de oposición al tratamiento (Art. 16)."""
    motivo: str = Field(min_length=10, max_length=500)
    tratamiento_especifico: Optional[str] = Field(
        default=None,
        description="Tipo de tratamiento al que se opone: 'analitico', 'difusion', 'todos'"
    )


class RevocacionRequest(BaseModel):
    """Solicitud de revocación de consentimiento (Art. 8)."""
    motivo: Optional[str] = Field(default=None, max_length=500)
    confirmar: bool = Field(description="Confirmación explícita de revocación")


class PortabilidadResponse(BaseModel):
    """Respuesta de portabilidad (Art. 17) — formato JSON interoperable."""
    formato: str = "JSON"
    version: str = "1.0"
    fecha_exportacion: datetime.datetime
    titular: dict
    casos: list[dict]
    pistas: list[dict]


# ============================================================
# Información del tratamiento (Art. 12 — 17 puntos obligatorios)
# ============================================================

INFORMACION_TRATAMIENTO = {
    "1_fines_tratamiento": [
        "Gestión y difusión de casos de personas desaparecidas en el DMQ",
        "Análisis geoespacial predictivo para apoyo en la búsqueda",
        "Generación de alertas comunitarias",
        "Estadísticas anonimizadas para políticas públicas"
    ],
    "2_base_legal": "Consentimiento explícito del titular (Art. 7.1, Art. 8 LOPDP). "
                    "Interés público por tratarse de búsqueda de personas desaparecidas (Art. 7.6 LOPDP).",
    "3_tipos_tratamiento": [
        "Recolección", "Cifrado AES-256-GCM", "Almacenamiento en PostgreSQL cifrado",
        "Análisis geoespacial (KDE, Markov)", "Difusión pública controlada (solo datos no sensibles)"
    ],
    "4_tiempo_conservacion": "Los datos se conservarán mientras el caso permanezca activo. "
                             "Casos archivados: 5 años. Después serán anonimizados para fines estadísticos (Art. 10i).",
    "5_existencia_base_datos": "Base de datos 'desaparecidos_db' operada por la Plataforma DMQ, "
                               "alojada en servidores dentro del territorio ecuatoriano.",
    "6_origen_datos": "Proporcionados directamente por el titular (familiar o allegado del desaparecido).",
    "7_finalidades_ulteriores": "Análisis estadístico anonimizado. No se realizará venta ni cesión a terceros.",
    "8_identidad_responsable": {
        "nombre": "Plataforma de Personas Desaparecidas - DMQ",
        "direccion": "Distrito Metropolitano de Quito, Ecuador",
        "email": "protecciondatos@plataforma-dmq.ec",
        "telefono": "+593 (02) XXX-XXXX"
    },
    "9_delegado_proteccion_datos": "Por designar — conforme Art. 48 LOPDP",
    "10_transferencias_internacionales": "No se realizan transferencias internacionales de datos personales.",
    "11_consecuencias_entrega_negativa": "Sin la información requerida no será posible registrar el caso de desaparición.",
    "12_efecto_datos_erroneos": "Datos inexactos podrían dificultar la búsqueda. El titular puede rectificarlos en cualquier momento (Art. 14).",
    "13_revocacion_consentimiento": "El titular puede revocar su consentimiento en cualquier momento "
                                    "a través de la sección 'Mis Derechos' o contactando al responsable (Art. 8).",
    "14_derechos_titular": [
        "Acceso (Art. 13)", "Rectificación (Art. 14)", "Eliminación (Art. 15)",
        "Oposición (Art. 16)", "Portabilidad (Art. 17)", "Suspensión (Art. 19)",
        "No decisión automatizada (Art. 20)"
    ],
    "15_portabilidad": "Disponible mediante endpoint /api/v1/derechos/portabilidad en formato JSON.",
    "16_reclamos": "Ante el responsable: protecciondatos@plataforma-dmq.ec. "
                   "Ante la Autoridad de Protección de Datos Personales del Ecuador: www.datospersonales.gob.ec",
    "17_decisiones_automatizadas": "El sistema utiliza modelos de IA (KDE, Markov, Random Forest) para generar "
                                   "polígonos de búsqueda predictivos. Estas predicciones son orientativas y NO "
                                   "constituyen decisiones vinculantes. El titular puede solicitar explicación (Art. 20)."
}


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/acceso", response_model=DatosPersonalesResponse)
async def derecho_acceso(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 13 — Derecho de Acceso.
    El titular tiene derecho a conocer y obtener gratuitamente todos sus datos personales.
    Plazo legal: 15 días.
    """
    # Descifrar datos personales del titular
    nombre_descifrado = decrypt_aes256(current_user.nombre_cifrado, aes_key)
    email_descifrado = decrypt_aes256(current_user.email_cifrado, aes_key)
    telefono_descifrado = decrypt_aes256(current_user.telefono_cifrado, aes_key)

    # Contar registros asociados
    result_casos = await db.execute(
        select(Desaparecido).where(Desaparecido.usuario_reportante_id == current_user.id)
    )
    casos_count = len(result_casos.scalars().all())

    result_pistas = await db.execute(
        select(Pista).where(Pista.usuario_id == current_user.id)
    )
    pistas_count = len(result_pistas.scalars().all())

    # Registrar auditoría del acceso
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="ARCO_ACCESO",
        detalle=json.dumps({"articulo": "Art. 13 LOPDP"}),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return DatosPersonalesResponse(
        nombre=nombre_descifrado,
        email=email_descifrado,
        telefono=telefono_descifrado,
        rol=current_user.rol.value,
        is_active=current_user.is_active,
        consentimiento_otorgado=current_user.consentimiento_otorgado,
        fecha_consentimiento=current_user.fecha_consentimiento,
        consentimiento_revocado=current_user.consentimiento_revocado,
        fecha_revocacion=current_user.fecha_revocacion,
        created_at=current_user.created_at,
        casos_registrados=casos_count,
        pistas_enviadas=pistas_count,
        informacion_tratamiento=INFORMACION_TRATAMIENTO
    )


@router.patch("/rectificacion")
async def derecho_rectificacion(
    request: Request,
    data: RectificacionRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 14 — Derecho de Rectificación y Actualización.
    El titular puede corregir datos personales inexactos o incompletos.
    Plazo legal: 15 días.
    """
    campos_actualizados = []

    if data.nombre is not None:
        current_user.nombre_cifrado = encrypt_aes256(data.nombre, aes_key)
        campos_actualizados.append("nombre")

    if data.email is not None:
        current_user.email_cifrado = encrypt_aes256(data.email, aes_key)
        campos_actualizados.append("email")

    if data.telefono is not None:
        current_user.telefono_cifrado = encrypt_aes256(data.telefono, aes_key)
        campos_actualizados.append("telefono")

    if not campos_actualizados:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un campo a rectificar."
        )

    # Auditoría
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="ARCO_RECTIFICACION",
        detalle=json.dumps({
            "articulo": "Art. 14 LOPDP",
            "campos_actualizados": campos_actualizados
        }),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return {
        "mensaje": "Datos rectificados exitosamente conforme al Art. 14 de la LOPDP.",
        "campos_actualizados": campos_actualizados,
        "plazo_legal": "Atendido dentro del plazo de 15 días (Art. 14)"
    }


@router.post("/eliminacion")
async def derecho_eliminacion(
    request: Request,
    data: EliminacionRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 15 — Derecho de Eliminación (Supresión).
    El titular puede solicitar la supresión de sus datos personales.
    Implementamos soft-delete para mantener integridad referencial de casos activos.
    Plazo legal: 15 días.
    """
    if not data.confirmar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe confirmar explícitamente la solicitud de eliminación."
        )

    # Verificar excepciones del Art. 18 (no procede eliminación si hay casos activos en interés público)
    result_casos_activos = await db.execute(
        select(Desaparecido).where(
            Desaparecido.usuario_reportante_id == current_user.id,
            Desaparecido.estado.in_(["PENDIENTE", "APROBADO"])
        )
    )
    casos_activos = result_casos_activos.scalars().all()

    if casos_activos:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No es posible eliminar los datos mientras existan {len(casos_activos)} caso(s) activo(s) "
                   f"de búsqueda. Esto se fundamenta en el Art. 18.8 de la LOPDP (interés vital del desaparecido). "
                   f"Puede solicitar la eliminación una vez los casos sean archivados o localizados."
        )

    # Soft delete: anonimizar datos personales cifrados
    current_user.nombre_cifrado = encrypt_aes256("[DATOS ELIMINADOS]", aes_key)
    current_user.email_cifrado = encrypt_aes256("[DATOS ELIMINADOS]", aes_key)
    current_user.telefono_cifrado = encrypt_aes256("[DATOS ELIMINADOS]", aes_key)
    current_user.is_active = False
    current_user.datos_eliminados = True
    current_user.consentimiento_revocado = True
    current_user.fecha_revocacion = datetime.datetime.now(datetime.timezone.utc)
    current_user.motivo_revocacion = data.motivo

    # Auditoría
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="ARCO_ELIMINACION",
        detalle=json.dumps({
            "articulo": "Art. 15 LOPDP",
            "motivo": data.motivo,
            "datos_anonimizados": True
        }),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return {
        "mensaje": "Datos personales eliminados conforme al Art. 15 de la LOPDP.",
        "nota": "Los datos han sido anonimizados. Los registros de casos se mantienen desvinculados por interés público.",
        "plazo_legal": "Atendido dentro del plazo de 15 días (Art. 15)"
    }


@router.post("/oposicion")
async def derecho_oposicion(
    request: Request,
    data: OposicionRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 16 — Derecho de Oposición.
    El titular puede oponerse al tratamiento de sus datos personales.
    Plazo legal: 15 días.
    """
    # Registrar la oposición
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="ARCO_OPOSICION",
        detalle=json.dumps({
            "articulo": "Art. 16 LOPDP",
            "motivo": data.motivo,
            "tratamiento_especifico": data.tratamiento_especifico or "todos"
        }),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)

    # Si se opone al tratamiento analítico, marcar en el usuario
    if data.tratamiento_especifico in ("analitico", "todos"):
        current_user.consentimiento_otorgado = False

    await db.commit()

    return {
        "mensaje": "Solicitud de oposición registrada conforme al Art. 16 de la LOPDP.",
        "tratamiento_afectado": data.tratamiento_especifico or "todos",
        "nota": "El responsable dejará de tratar los datos para los fines indicados, "
                "salvo que acredite motivos legítimos (Art. 16 párrafo final).",
        "plazo_legal": "Atendido dentro del plazo de 15 días (Art. 16)"
    }


@router.get("/portabilidad")
async def derecho_portabilidad(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 17 — Derecho de Portabilidad.
    El titular tiene derecho a recibir sus datos en formato compatible, estructurado,
    común, interoperable y de lectura mecánica.
    """
    # Descifrar datos del titular
    nombre = decrypt_aes256(current_user.nombre_cifrado, aes_key)
    email = decrypt_aes256(current_user.email_cifrado, aes_key)
    telefono = decrypt_aes256(current_user.telefono_cifrado, aes_key)

    # Obtener casos asociados
    result_casos = await db.execute(
        select(Desaparecido).where(Desaparecido.usuario_reportante_id == current_user.id)
    )
    casos = result_casos.scalars().all()
    casos_data = []
    for c in casos:
        casos_data.append({
            "id": str(c.id),
            "nombres": c.nombres,
            "apellidos": c.apellidos,
            "edad": c.edad,
            "sexo": c.sexo,
            "fecha_desaparicion": str(c.fecha_desaparicion),
            "parroquia": c.parroquia_desaparicion,
            "estado": c.estado.value if hasattr(c.estado, 'value') else str(c.estado),
            "created_at": str(c.created_at)
        })

    # Obtener pistas enviadas
    result_pistas = await db.execute(
        select(Pista).where(Pista.usuario_id == current_user.id)
    )
    pistas = result_pistas.scalars().all()
    pistas_data = []
    for p in pistas:
        pistas_data.append({
            "id": str(p.id),
            "desaparecido_id": str(p.desaparecido_id),
            "descripcion": p.descripcion,
            "estado": p.estado.value if hasattr(p.estado, 'value') else str(p.estado),
            "created_at": str(p.created_at)
        })

    # Auditoría
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="ARCO_PORTABILIDAD",
        detalle=json.dumps({"articulo": "Art. 17 LOPDP", "formato": "JSON"}),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return PortabilidadResponse(
        fecha_exportacion=datetime.datetime.now(datetime.timezone.utc),
        titular={
            "nombre": nombre,
            "email": email,
            "telefono": telefono,
            "rol": current_user.rol.value,
            "fecha_registro": str(current_user.created_at),
            "consentimiento_activo": current_user.consentimiento_otorgado
        },
        casos=casos_data,
        pistas=pistas_data
    )


@router.post("/revocar-consentimiento")
async def revocar_consentimiento(
    request: Request,
    data: RevocacionRequest,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Art. 8 — Revocación de Consentimiento.
    'El consentimiento podrá revocarse en cualquier momento sin que sea necesaria
    una justificación [...] mediante un procedimiento sencillo, similar al proceder
    con el cual recabó el consentimiento.'
    """
    if not data.confirmar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe confirmar explícitamente la revocación."
        )

    if current_user.consentimiento_revocado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El consentimiento ya fue revocado previamente."
        )

    current_user.consentimiento_otorgado = False
    current_user.consentimiento_revocado = True
    current_user.fecha_revocacion = datetime.datetime.now(datetime.timezone.utc)
    current_user.motivo_revocacion = data.motivo

    # Auditoría
    audit = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="REVOCACION_CONSENTIMIENTO",
        detalle=json.dumps({
            "articulo": "Art. 8 LOPDP",
            "motivo": data.motivo,
            "nota": "El tratamiento realizado antes de revocar el consentimiento es lícito (Art. 8 párrafo 3)."
        }),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit)
    await db.commit()

    return {
        "mensaje": "Consentimiento revocado exitosamente conforme al Art. 8 de la LOPDP.",
        "fecha_revocacion": str(current_user.fecha_revocacion),
        "nota_legal": "Conforme al Art. 8 párrafo 3 de la LOPDP, el tratamiento realizado "
                      "antes de la revocación es lícito y no tiene efectos retroactivos.",
        "impacto": "Sus datos personales ya no serán utilizados para análisis predictivo. "
                   "Los casos de búsqueda activos se mantendrán por interés vital (Art. 7.6)."
    }
