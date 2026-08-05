from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func as sa_func
from geoalchemy2.shape import to_shape
import math
import uuid

from app.api.deps import get_db, get_familiar_or_admin
from app.db.models import Usuario, Desaparecido
from app.schemas.prediction import GeoJSONResponse

router = APIRouter(prefix="/prediction", tags=["Motor Predictivo"])


def extract_coords_from_geometry(geom) -> tuple[float, float]:
    """
    Extrae lat y lng de un objeto WKBElement de GeoAlchemy2.
    Retorna (lat, lng). Si geom es None, retorna (0.0, 0.0).
    """
    if geom is None:
        return 0.0, 0.0
    try:
        point = to_shape(geom)
        return point.y, point.x  # lat = y, lng = x
    except Exception:
        return 0.0, 0.0


def generar_poligono_circular(
    lat: float, lng: float, radius_km: float = 2.0, num_points: int = 12
) -> list[list[list[float]]]:
    """
    Genera coordenadas GeoJSON para un polígono circular alrededor de un punto central.
    Conversión aproximada: 1 grado latitud ~ 111 km.
    """
    points = []
    lat_offset = radius_km / 111.0
    lng_offset = radius_km / (111.0 * math.cos(math.radians(lat)))

    for i in range(num_points):
        angle = math.pi * 2 * i / num_points
        d_lat = math.sin(angle) * lat_offset
        d_lng = math.cos(angle) * lng_offset
        points.append([lng + d_lng, lat + d_lat])
    # Cerrar el polígono
    points.append(points[0])
    return [points]


@router.get("/kde/{caso_id}", response_model=GeoJSONResponse)
async def obtener_prediccion_kde(
    caso_id: uuid.UUID,
    current_user: Usuario = Depends(get_familiar_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna la predicción KDE (Mapa de Calor) para el caso especificado.
    RBAC: Solo ADMIN o FAMILIAR — §3.4.
    STUB: Modelo real será entrenado en Fase 2.
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    lat, lng = extract_coords_from_geometry(caso.punto_a)

    poligono = generar_poligono_circular(lat, lng, radius_km=3.0)

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": poligono
        },
        "properties": {
            "modelo": "KDE",
            "version": "stub_v1",
            "nota": "Modelo real será entrenado en Fase 2",
            "densidad_maxima": 0.85
        }
    }

    return {"type": "FeatureCollection", "features": [feature]}


@router.get("/markov/{caso_id}", response_model=GeoJSONResponse)
async def obtener_prediccion_markov(
    caso_id: uuid.UUID,
    current_user: Usuario = Depends(get_familiar_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna la predicción de Markov (Vectores de Trayectoria) para el caso.
    RBAC: Solo ADMIN o FAMILIAR — §3.4.
    STUB: Modelo real será entrenado en Fase 2.
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    lat, lng = extract_coords_from_geometry(caso.punto_a)

    # Simular una trayectoria de movimiento hacia el noreste
    trajectory = [
        [lng, lat],
        [lng + 0.01, lat + 0.01],
        [lng + 0.02, lat + 0.015],
        [lng + 0.03, lat + 0.02]
    ]

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": trajectory
        },
        "properties": {
            "modelo": "Markov",
            "version": "stub_v1",
            "probabilidad": 0.75
        }
    }

    return {"type": "FeatureCollection", "features": [feature]}


@router.get("/poligono/{caso_id}", response_model=GeoJSONResponse)
async def obtener_prediccion_poligono(
    caso_id: uuid.UUID,
    current_user: Usuario = Depends(get_familiar_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna el Polígono de Búsqueda Predictiva (Random Forest) para el caso.
    RBAC: Solo ADMIN o FAMILIAR — §3.4.
    STUB: Modelo real será entrenado en Fase 2.
    """
    result = await db.execute(select(Desaparecido).where(Desaparecido.id == caso_id))
    caso = result.scalars().first()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    lat, lng = extract_coords_from_geometry(caso.punto_a)

    poligono = generar_poligono_circular(lat, lng, radius_km=1.5, num_points=6)

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": poligono
        },
        "properties": {
            "modelo": "RandomForest",
            "version": "stub_v1",
            "prioridad": "Alta"
        }
    }

    return {"type": "FeatureCollection", "features": [feature]}
