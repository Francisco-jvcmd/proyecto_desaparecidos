from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.core.config import get_settings

# Importar routers reales del módulo api/v1
from app.api.v1 import familiar, comunidad, admin, prediction, derechos_arco

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Iniciando Plataforma de Personas Desaparecidas API - DMQ...")
    yield
    logger.info("🛑 Apagando API...")

app = FastAPI(
    title="API Plataforma de Personas Desaparecidas - DMQ",
    description="Sistema inteligente para gestión, difusión y predicción geoespacial de personas desaparecidas en el Distrito Metropolitano de Quito (2017-2025)",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers con prefijos que coinciden con los definidos internamente
# Cada router ya tiene su propio prefix (/familiar, /comunidad, /admin, /prediction)
app.include_router(familiar.router, prefix="/api/v1", tags=["Módulo Familiar"])
app.include_router(comunidad.router, prefix="/api/v1", tags=["Módulo Comunidad"])
app.include_router(admin.router, prefix="/api/v1", tags=["Módulo Administración"])
app.include_router(prediction.router, prefix="/api/v1", tags=["Motor Predictivo"])
app.include_router(derechos_arco.router, prefix="/api/v1", tags=["Derechos ARCO - LOPDP"])

@app.get("/", tags=["Health"])
@app.head("/", include_in_schema=False)
async def root():
    """Ruta raíz para health check de Render."""
    return {"status": "ok", "version": "1.0.0", "servicio": "Plataforma Desaparecidos DMQ"}

@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de verificación de salud del servicio."""
    return {"status": "ok", "version": "1.0.0", "servicio": "Plataforma Desaparecidos DMQ"}

@app.get("/debug/email-config", tags=["Debug"])
async def debug_email_config():
    """Diagnóstico temporal: muestra la configuración de email (sin credenciales)."""
    return {
        "smtp_host": settings.SMTP_HOST or "(vacío)",
        "smtp_port": settings.SMTP_PORT,
        "smtp_user": settings.SMTP_USER[:4] + "***" if settings.SMTP_USER else "(vacío)",
        "smtp_password_set": bool(settings.SMTP_PASSWORD and settings.SMTP_PASSWORD.strip()),
        "smtp_password_length": len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 0,
        "email_from": settings.EMAIL_FROM,
        "resend_api_key_set": bool(settings.RESEND_API_KEY and settings.RESEND_API_KEY != "placeholder"),
        "frontend_url": settings.FRONTEND_URL,
    }

@app.get("/debug/test-email", tags=["Debug"])
async def debug_test_email(to: str = "diego23cumbajin@gmail.com"):
    """Diagnóstico temporal: envía un correo de prueba y devuelve el resultado."""
    from app.core.email import send_verification_email
    from app.core.security import create_verification_token
    import traceback
    try:
        token = create_verification_token("test-debug-id", to)
        result = await send_verification_email(to, "Prueba Diagnóstico", token)
        return {"success": result, "sent_to": to, "method": "SMTP/Resend"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
