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

