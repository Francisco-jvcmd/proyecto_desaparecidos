import asyncio
import logging
from sqlalchemy import text
from app.db.session import engine, Base
import app.db.models  # Ensure all models are registered with Base.metadata
from app.db.seed import seed_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    logger.info("📡 Conectando a la base de datos Neon PostgreSQL...")
    async with engine.begin() as conn:
        logger.info("⚙️ Habilitando extensión PostGIS en Neon...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        
        logger.info("🔨 Creando tablas en la base de datos (usuarios, desaparecidos, pistas, audit_logs)...")
        await conn.run_sync(Base.metadata.create_all)
        
    logger.info("✅ Tablas e infraestructura de PostGIS creadas exitosamente en Neon!")
    
    logger.info("🌱 Ejecutando siembra inicial de datos (Admin y registros)...")
    await seed_data()
    logger.info("🚀 Inicialización de base de datos Neon finalizada con éxito.")

if __name__ == "__main__":
    asyncio.run(init_db())
