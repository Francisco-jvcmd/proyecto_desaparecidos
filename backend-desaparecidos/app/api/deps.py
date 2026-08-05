from typing import Optional, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.db.models import Usuario, RolUsuario
from app.core.security import decode_jwt_token

# Se utiliza la URL de login definida en el módulo familiar
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/familiar/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> Usuario:
    """
    Obtiene el usuario autenticado actual verificando el token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_jwt_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    return user

async def get_current_user_optional(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/familiar/auth/login", auto_error=False)), 
    db: AsyncSession = Depends(get_db)
) -> Optional[Usuario]:
    """
    Igual que get_current_user pero no lanza error si no hay token.
    """
    if not token:
        return None
    try:
        return await get_current_user(token=token, db=db)
    except HTTPException:
        return None

def require_role(*roles: RolUsuario) -> Callable:
    """
    Fábrica de dependencias para verificar los roles del usuario.
    """
    async def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene los permisos suficientes para esta acción",
            )
        return current_user
    return role_checker

# Dependencias preconfiguradas para uso común
get_admin_user = require_role(RolUsuario.ADMIN)
get_familiar_or_admin = require_role(RolUsuario.ADMIN, RolUsuario.FAMILIAR)
