from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid
import json
import datetime

from app.api.deps import get_db, get_current_user
from app.db.models import Usuario, Desaparecido, RolUsuario, EstadoCaso, AuditLog
from app.schemas.desaparecido import DesaparecidoCreate, DesaparecidoResponse, DesaparecidoPublico
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, TokenResponse
from app.core.config import get_settings
from app.core.security import (
    validar_cedula_ec, encrypt_aes256, decrypt_aes256,
    hash_password, verify_password, create_jwt_token
)

router = APIRouter(prefix="/familiar", tags=["Módulo Familiar"])
limiter = Limiter(key_func=get_remote_address)

settings = get_settings()
aes_key = bytes.fromhex(settings.AES_KEY)


@router.post("/registro", response_model=DesaparecidoResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/15minutes")
async def registro_caso(
    request: Request,
    data: DesaparecidoCreate,
    usuario_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo caso de desaparecido junto con el usuario denunciante.
    Valida cédulas con Módulo 10, cifra PII con AES-256-GCM.
    """
    # Doble validación de cédula (adicional a la de Pydantic) — §8.1
    if not validar_cedula_ec(usuario_data.cedula):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cédula del denunciante inválida según Módulo 10"
        )
    if not validar_cedula_ec(data.cedula_desaparecido):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cédula del desaparecido inválida según Módulo 10"
        )

    # Cifrado AES-256 de PII del denunciante — §2.3, §8.5
    cedula_hash = hash_password(usuario_data.cedula)

    # Verificar si el usuario ya existe por hash de cédula
    result_user = await db.execute(
        select(Usuario).where(Usuario.cedula_hash == cedula_hash)
    )
    existing_user = result_user.scalars().first()

    if existing_user:
        nuevo_usuario = existing_user
    else:
        nuevo_usuario = Usuario(
            id=uuid.uuid4(),
            nombre_cifrado=encrypt_aes256(usuario_data.nombre, aes_key),
            email_cifrado=encrypt_aes256(usuario_data.email, aes_key),
            telefono_cifrado=encrypt_aes256(usuario_data.telefono, aes_key),
            cedula_hash=cedula_hash,
            password_hash=hash_password(usuario_data.password),
            rol=RolUsuario.FAMILIAR,
            is_active=True,
        )
        db.add(nuevo_usuario)
        await db.flush()

    # Crear geometría PostGIS POINT para Punto A — usar campos correctos del schema
    punto_a_wkt = f'SRID=4326;POINT({data.punto_a_lng} {data.punto_a_lat})'

    nuevo_desaparecido = Desaparecido(
        id=uuid.uuid4(),
        nombres=data.nombres,
        apellidos=data.apellidos,
        cedula_desaparecido=data.cedula_desaparecido,
        edad=data.edad,
        sexo=data.sexo,
        estatura_cm=data.estatura_cm,
        complexion=data.complexion,
        color_piel=data.color_piel,
        color_cabello=data.color_cabello,
        ropa_descripcion=data.ropa_descripcion,
        senas_particulares=data.senas_particulares,
        fecha_desaparicion=data.fecha_desaparicion,
        hora_aproximada=data.hora_aproximada,
        punto_a=punto_a_wkt,
        parroquia_desaparicion=data.parroquia_desaparicion,
        barrio=data.barrio,
        estado=EstadoCaso.PENDIENTE,
        usuario_reportante_id=nuevo_usuario.id,
        consentimiento_firmado=True,
    )
    db.add(nuevo_desaparecido)

    # Audit log con detalle serializado como JSON string
    audit_log = AuditLog(
        id=uuid.uuid4(),
        usuario_id=nuevo_usuario.id,
        accion="REGISTRO_CASO",
        detalle=json.dumps({"caso_id": str(nuevo_desaparecido.id)}),
        ip_address=request.client.host if request.client else None,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(nuevo_desaparecido)
    return nuevo_desaparecido


@router.get("/caso/{caso_id}", response_model=DesaparecidoPublico)
async def obtener_caso_publico(
    caso_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene los datos públicos de un caso aprobado. No expone PII del denunciante.
    """
    result = await db.execute(
        select(Desaparecido).where(Desaparecido.id == caso_id)
    )
    caso = result.scalars().first()

    if not caso or caso.estado != EstadoCaso.APROBADO:
        raise HTTPException(status_code=404, detail="Caso no encontrado o no aprobado")

    return caso


@router.get("/mis-casos", response_model=list[DesaparecidoResponse])
async def mis_casos(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna la lista de casos reportados por el usuario autenticado.
    """
    result = await db.execute(
        select(Desaparecido).where(
            Desaparecido.usuario_reportante_id == current_user.id
        )
    )
    return result.scalars().all()


@router.post("/auth/registro", response_model=TokenResponse)
async def registro_usuario(
    usuario_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva cuenta de usuario (Familiar).
    Valida cédula con Módulo 10, cifra PII con AES-256.
    """
    if not validar_cedula_ec(usuario_data.cedula):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cédula inválida según Módulo 10"
        )

    nuevo_usuario = Usuario(
        id=uuid.uuid4(),
        nombre_cifrado=encrypt_aes256(usuario_data.nombre, aes_key),
        email_cifrado=encrypt_aes256(usuario_data.email, aes_key),
        telefono_cifrado=encrypt_aes256(usuario_data.telefono, aes_key),
        cedula_hash=hash_password(usuario_data.cedula),
        password_hash=hash_password(usuario_data.password),
        rol=RolUsuario.FAMILIAR,
        is_active=True,
    )
    db.add(nuevo_usuario)
    await db.commit()
    await db.refresh(nuevo_usuario)

    token = create_jwt_token({"sub": str(nuevo_usuario.id), "rol": nuevo_usuario.rol.value})
    return {"access_token": token, "token_type": "bearer", "rol": nuevo_usuario.rol.value}


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    login_data: UsuarioLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Inicia sesión de usuario. Busca por email descifrando con AES-256.
    NOTA: Para producción, implementar email_hash indexado para O(1) lookup.
    """
    # Obtener todos los usuarios y descifrar email para encontrar coincidencia
    # TODO: Optimizar con email_hash indexado (HMAC-SHA256) para búsqueda directa
    result = await db.execute(select(Usuario).where(Usuario.is_active == True))
    usuarios = result.scalars().all()

    user_found = None
    for u in usuarios:
        try:
            decrypted_email = decrypt_aes256(u.email_cifrado, aes_key)
            if decrypted_email == login_data.email:
                user_found = u
                break
        except Exception:
            continue

    if not user_found or not verify_password(login_data.password, user_found.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_jwt_token({"sub": str(user_found.id), "rol": user_found.rol.value})
    return {"access_token": token, "token_type": "bearer", "rol": user_found.rol.value}


@router.post("/afiche/{caso_id}")
async def generar_afiche(caso_id: uuid.UUID):
    """
    Genera el afiche PDF del caso (STUB — será implementado en Fase 3 con WeasyPrint).
    """
    return {"message": "Generación de PDF será implementada en Fase 3", "caso_id": str(caso_id)}
