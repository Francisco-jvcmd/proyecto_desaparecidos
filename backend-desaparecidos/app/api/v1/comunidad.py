from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid
import json
import datetime

from app.api.deps import get_db, get_current_user_optional, get_current_user
from app.db.models import Usuario, Desaparecido, Pista, EstadoCaso, EstadoPista, AuditLog
from app.schemas.desaparecido import DesaparecidoPublico
from app.schemas.pista import PistaCreate, PistaResponse

router = APIRouter(prefix="/comunidad", tags=["Módulo Comunidad"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/casos-aprobados", response_model=list[DesaparecidoPublico])
async def obtener_casos_aprobados(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    nombre: str = None,
    parroquia: str = None,
    sexo: str = None,
    edad_min: int = None,
    edad_max: int = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna la lista paginada de casos aprobados para la comunidad.
    JAMÁS incluye información personal del denunciante — §3.2.
    """
    query = select(Desaparecido).where(Desaparecido.estado == EstadoCaso.APROBADO)

    if nombre:
        query = query.where(
            Desaparecido.nombres.ilike(f"%{nombre}%") |
            Desaparecido.apellidos.ilike(f"%{nombre}%")
        )
    if parroquia:
        query = query.where(Desaparecido.parroquia_desaparicion.ilike(f"%{parroquia}%"))
    if sexo:
        query = query.where(Desaparecido.sexo == sexo)
    if edad_min is not None:
        query = query.where(Desaparecido.edad >= edad_min)
    if edad_max is not None:
        query = query.where(Desaparecido.edad <= edad_max)

    query = query.order_by(Desaparecido.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    casos = result.scalars().all()

    return casos


@router.post("/pista", response_model=PistaResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/15minutes")
async def reportar_pista(
    request: Request,
    data: PistaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reporta una nueva pista para un caso de desaparición.
    Requiere autenticación (Google OAuth o registro regular) — §3.2.
    """
    # Validar que caso existe y está aprobado
    result = await db.execute(
        select(Desaparecido).where(Desaparecido.id == data.desaparecido_id)
    )
    caso = result.scalars().first()

    if not caso or caso.estado != EstadoCaso.APROBADO:
        raise HTTPException(
            status_code=400,
            detail="El caso no existe o no está aprobado para recibir pistas"
        )

    ubicacion_wkt = None
    if data.lat is not None and data.lng is not None:
        ubicacion_wkt = f'SRID=4326;POINT({data.lng} {data.lat})'

    nueva_pista = Pista(
        id=uuid.uuid4(),
        desaparecido_id=data.desaparecido_id,
        usuario_id=current_user.id,
        descripcion=data.descripcion,
        foto_url=data.foto_url,
        ubicacion=ubicacion_wkt,
        estado=EstadoPista.PENDIENTE,
    )
    db.add(nueva_pista)

    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_user.id,
        accion="REPORTE_PISTA",
        detalle=json.dumps({"pista_id": str(nueva_pista.id), "caso_id": str(caso.id)}),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(nueva_pista)
    return nueva_pista


@router.get("/caso/{caso_id}/pistas", response_model=list[PistaResponse])
async def obtener_pistas_caso(
    caso_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene las pistas aprobadas para un caso en específico.
    """
    result = await db.execute(
        select(Pista).where(
            (Pista.desaparecido_id == caso_id) &
            (Pista.estado == EstadoPista.APROBADA)
        )
    )
    return result.scalars().all()
