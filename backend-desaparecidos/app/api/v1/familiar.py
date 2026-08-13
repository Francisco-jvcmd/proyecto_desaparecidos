from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, status, Query
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
from app.schemas.usuario import (
    UsuarioCreate, UsuarioLogin, TokenResponse,
    RegistroResponse, VerificarEmailRequest, ReenviarEmailRequest, VerificarEmailResponse
)
from app.core.config import get_settings
from app.core.security import (
    validar_cedula_ec, encrypt_aes256, decrypt_aes256,
    hash_password, verify_password, create_jwt_token,
    create_verification_token, verify_verification_token,
    hash_cedula_blind_index
)
from app.core.email import send_verification_email

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
    cedula_hash = hash_cedula_blind_index(usuario_data.cedula)

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


@router.post("/auth/registro", response_model=RegistroResponse)
async def registro_usuario(
    usuario_data: UsuarioCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva cuenta de usuario (Familiar) y envía un correo de activación.
    Valida cédula con Módulo 10 y cifra PII con AES-256-GCM.
    """
    if not validar_cedula_ec(usuario_data.cedula):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cédula inválida según el algoritmo Módulo 10 del Registro Civil"
        )

    cedula_hash = hash_cedula_blind_index(usuario_data.cedula)

    # Verificar si el usuario ya existe por cédula
    result_user = await db.execute(
        select(Usuario).where(Usuario.cedula_hash == cedula_hash)
    )
    if result_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con este número de cédula de identidad."
        )

    # Verificar si el email ya está registrado descifrando
    result_all = await db.execute(select(Usuario))
    for u in result_all.scalars().all():
        try:
            decrypted = decrypt_aes256(u.email_cifrado, aes_key)
            if decrypted.lower() == usuario_data.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una cuenta registrada con este correo electrónico."
                )
        except HTTPException:
            raise
        except Exception:
            continue

    user_id = uuid.uuid4()
    nuevo_usuario = Usuario(
        id=user_id,
        nombre_cifrado=encrypt_aes256(usuario_data.nombre, aes_key),
        email_cifrado=encrypt_aes256(usuario_data.email, aes_key),
        telefono_cifrado=encrypt_aes256(usuario_data.telefono, aes_key),
        cedula_hash=cedula_hash,
        password_hash=hash_password(usuario_data.password),
        rol=RolUsuario.FAMILIAR,
        is_active=False,  # Requiere confirmación de correo
    )
    db.add(nuevo_usuario)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con estos datos (cédula o correo electrónico)."
        )

    # Generar token de verificación y enviar correo en segundo plano
    token_verificacion = create_verification_token(str(user_id), usuario_data.email)
    background_tasks.add_task(
        send_verification_email,
        usuario_data.email,
        usuario_data.nombre,
        token_verificacion
    )

    return {
        "message": "Cuenta creada con éxito. Hemos enviado un correo con el enlace de activación.",
        "email": usuario_data.email,
        "requiere_verificacion": True
    }


@router.post("/auth/verificar-email", response_model=VerificarEmailResponse)
async def verificar_email_post(
    data: VerificarEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifica el correo del usuario mediante el token firmado.
    Activa la cuenta y retorna un JWT de sesión listo para usar.
    """
    payload = verify_verification_token(data.token)
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.is_active = True
    await db.commit()

    auth_token = create_jwt_token({"sub": str(user.id), "rol": user.rol.value})
    return {
        "message": "¡Correo electrónico verificado exitosamente! Tu cuenta ha sido activada.",
        "access_token": auth_token,
        "token_type": "bearer",
        "rol": user.rol.value
    }


@router.get("/auth/verificar-email", response_model=VerificarEmailResponse)
async def verificar_email_get(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Soporte GET para enlaces directos de verificación desde el correo.
    """
    return await verificar_email_post(VerificarEmailRequest(token=token), db)


@router.post("/auth/reenviar-verificacion")
async def reenviar_verificacion(
    data: ReenviarEmailRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Reenvía el correo de verificación a un usuario no activado.
    """
    result = await db.execute(select(Usuario))
    target_user = None
    target_nombre = "Usuario"

    for u in result.scalars().all():
        try:
            decrypted_email = decrypt_aes256(u.email_cifrado, aes_key)
            if decrypted_email.lower() == data.email.lower():
                target_user = u
                target_nombre = decrypt_aes256(u.nombre_cifrado, aes_key)
                break
        except Exception:
            continue

    if not target_user:
        raise HTTPException(status_code=404, detail="No existe una cuenta registrada con este correo.")

    if target_user.is_active:
        return {"message": "Esta cuenta ya está verificada y activa. Puedes iniciar sesión directamente."}

    token = create_verification_token(str(target_user.id), data.email)
    background_tasks.add_task(send_verification_email, data.email, target_nombre, token)

    return {"message": "Se ha reenviado un nuevo correo de activación. Por favor revisa tu bandeja de entrada."}


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    login_data: UsuarioLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Inicia sesión de usuario. Verifica credenciales y estado de activación por correo.
    """
    result = await db.execute(select(Usuario))
    usuarios = result.scalars().all()

    user_found = None
    for u in usuarios:
        try:
            decrypted_email = decrypt_aes256(u.email_cifrado, aes_key)
            if decrypted_email.lower() == login_data.email.lower():
                user_found = u
                break
        except Exception:
            continue

    if not user_found or not verify_password(login_data.password, user_found.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user_found.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta aún no ha sido verificada. Por favor revisa tu correo electrónico o solicita un nuevo enlace de activación."
        )

    token = create_jwt_token({"sub": str(user_found.id), "rol": user_found.rol.value})
    return {"access_token": token, "token_type": "bearer", "rol": user_found.rol.value}


@router.post("/afiche/{caso_id}")
async def generar_afiche(caso_id: uuid.UUID):
    """
    Genera el afiche PDF del caso (STUB — será implementado en Fase 3 con WeasyPrint).
    """
    return {"message": "Generación de PDF será implementada en Fase 3", "caso_id": str(caso_id)}

