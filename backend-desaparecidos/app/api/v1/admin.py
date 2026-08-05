from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid
import json
import datetime

from app.api.deps import get_db, get_admin_user
from app.db.models import Usuario, Desaparecido, Pista, EstadoCaso, EstadoPista, AuditLog
from app.schemas.desaparecido import DesaparecidoResponse, DesaparecidoAdminUpdate
from app.schemas.pista import PistaResponse, PistaModerar

router = APIRouter(prefix="/admin", tags=["Módulo Administración"])


@router.get("/casos-pendientes", response_model=list[DesaparecidoResponse])
async def casos_pendientes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene los casos con estado PENDIENTE. Solo administradores.
    Incluye paginación para escalabilidad.
    """
    result = await db.execute(
        select(Desaparecido)
        .where(Desaparecido.estado == EstadoCaso.PENDIENTE)
        .order_by(Desaparecido.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.patch("/caso/{caso_id}/aprobar", response_model=DesaparecidoResponse)
async def aprobar_caso(
    request: Request,
    caso_id: uuid.UUID,
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambia el estado de un caso a APROBADO — §3.3.
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    caso.estado = EstadoCaso.APROBADO
    caso.updated_at = datetime.datetime.now(datetime.timezone.utc)

    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_admin.id,
        accion="APROBAR_CASO",
        detalle=json.dumps({"caso_id": str(caso_id)}),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(caso)
    return caso


@router.patch("/caso/{caso_id}/rechazar", response_model=DesaparecidoResponse)
async def rechazar_caso(
    request: Request,
    caso_id: uuid.UUID,
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambia el estado de un caso a ARCHIVADO (Rechazado).
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    caso.estado = EstadoCaso.ARCHIVADO
    caso.updated_at = datetime.datetime.now(datetime.timezone.utc)

    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_admin.id,
        accion="RECHAZAR_CASO",
        detalle=json.dumps({"caso_id": str(caso_id)}),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(caso)
    return caso


@router.patch("/caso/{caso_id}/localizado", response_model=DesaparecidoResponse)
async def localizar_caso(
    request: Request,
    caso_id: uuid.UUID,
    data: DesaparecidoAdminUpdate,
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cambia el estado de un caso a LOCALIZADO. Requiere coordenadas de Punto B — §6.
    Dispara re-entrenamiento del modelo predictivo cuando se acumulan N casos.
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    if data.punto_b_lat is not None and data.punto_b_lng is not None:
        caso.punto_b = f'SRID=4326;POINT({data.punto_b_lng} {data.punto_b_lat})'
    else:
        raise HTTPException(
            status_code=400,
            detail="Debe proporcionar punto_b_lat y punto_b_lng para marcar como localizado"
        )

    caso.estado = EstadoCaso.LOCALIZADO
    caso.updated_at = datetime.datetime.now(datetime.timezone.utc)

    # TODO (Fase 2): Trigger re-entrenamiento cuando se acumulen N nuevos casos resueltos
    # Ejecutar: python -m app.ml_models.train al acumular suficientes vectores cerrados

    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_admin.id,
        accion="LOCALIZAR_CASO",
        detalle=json.dumps({
            "caso_id": str(caso_id),
            "punto_b_lat": data.punto_b_lat,
            "punto_b_lng": data.punto_b_lng,
        }),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(caso)
    return caso


@router.get("/cola-pistas", response_model=list[PistaResponse])
async def cola_pistas(
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todas las pistas en estado PENDIENTE para moderación — §3.3.
    """
    result = await db.execute(
        select(Pista)
        .where(Pista.estado == EstadoPista.PENDIENTE)
        .order_by(Pista.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/pista/{pista_id}/moderar", response_model=PistaResponse)
async def moderar_pista(
    request: Request,
    pista_id: uuid.UUID,
    data: PistaModerar,
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Modera una pista: APROBADA o DESCARTADA.
    """
    result = await db.execute(select(Pista).where(Pista.id == pista_id))
    pista = result.scalars().first()
    if not pista:
        raise HTTPException(status_code=404, detail="Pista no encontrada")

    pista.estado = data.estado

    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=current_admin.id,
        accion="MODERAR_PISTA",
        detalle=json.dumps({"pista_id": str(pista_id), "nuevo_estado": data.estado}),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(pista)
    return pista


@router.get("/estadisticas")
async def estadisticas(
    current_admin: Usuario = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna estadísticas del dashboard administrativo.
    """
    # Totales de casos por estado
    res_casos = await db.execute(
        select(Desaparecido.estado, func.count(Desaparecido.id))
        .group_by(Desaparecido.estado)
    )
    casos_count = dict(res_casos.all())

    total_casos = sum(casos_count.values())

    # Totales de pistas por estado
    res_pistas = await db.execute(
        select(Pista.estado, func.count(Pista.id))
        .group_by(Pista.estado)
    )
    pistas_count = dict(res_pistas.all())
    total_pistas = sum(pistas_count.values())

    return {
        "total_casos": total_casos,
        "casos_pendientes": casos_count.get(EstadoCaso.PENDIENTE, 0),
        "casos_aprobados": casos_count.get(EstadoCaso.APROBADO, 0),
        "casos_localizados": casos_count.get(EstadoCaso.LOCALIZADO, 0),
        "total_pistas": total_pistas,
        "pistas_pendientes": pistas_count.get(EstadoPista.PENDIENTE, 0),
        "casos_por_mes": []  # Stub — serie temporal implementada en Fase 2
    }
