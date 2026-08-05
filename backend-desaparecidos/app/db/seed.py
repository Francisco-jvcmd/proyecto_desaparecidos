import asyncio
import pandas as pd
from pathlib import Path
import logging
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.db.models import Usuario, Desaparecido, RolUsuario, EstadoCaso
from app.core.security import hash_password, encrypt_aes256
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    settings = get_settings()
    data_dir = Path(__file__).parent.parent.parent / "data"
    general_csv = data_dir / "desaparecidos_general.csv"
    trayectorias_csv = data_dir / "desaparecidos_trayectorias.csv"

    async with AsyncSessionLocal() as session:
        # Create Default Admin
        try:
            # Check if Admin user exists
            from sqlalchemy.future import select
            res_admin = await session.execute(select(Usuario).where(Usuario.rol == RolUsuario.ADMIN))
            admin_user = res_admin.scalars().first()

            if not admin_user:
                aes_key = bytes.fromhex(settings.AES_KEY)
                admin_user = Usuario(
                    nombre_cifrado=encrypt_aes256("Admin General", aes_key),
                    email_cifrado=encrypt_aes256("admin@desaparecidos.ec", aes_key),
                    telefono_cifrado=encrypt_aes256("0999999999", aes_key),
                    cedula_hash=hash_password("0000000000"),
                    password_hash=hash_password("admin_password"),
                    rol=RolUsuario.ADMIN,
                    is_active=True
                )
                session.add(admin_user)
                await session.flush()
                logger.info("Admin user created.")
            else:
                logger.info("Admin user already exists.")
            
            admin_id = admin_user.id

            # Load General Data
            if general_csv.exists():
                logger.info(f"Loading {general_csv}...")
                df_general = pd.read_csv(general_csv, on_bad_lines='skip', engine='python')
                for index, row in df_general.iterrows():
                    try:
                        punto_a_wkt = f"SRID=4326;POINT({row.get('lng', -78.5)} {row.get('lat', -0.2)})"
                        
                        desaparecido = Desaparecido(
                            nombres=str(row.get('nombres', 'Desconocido')),
                            apellidos=str(row.get('apellidos', 'Desconocido')),
                            edad=int(row.get('edad')) if pd.notnull(row.get('edad')) else None,
                            sexo=str(row.get('sexo')) if pd.notnull(row.get('sexo')) else None,
                            fecha_desaparicion=pd.to_datetime(row.get('fecha_desaparicion', datetime.today())).date(),
                            punto_a=punto_a_wkt,
                            estado=EstadoCaso.APROBADO,
                            usuario_reportante_id=admin_id,
                            consentimiento_firmado=True
                        )
                        session.add(desaparecido)
                    except Exception as e:
                        logger.warning(f"Error row {index}: {e}")
            else:
                logger.warning(f"File {general_csv} not found.")

            # Load Trayectorias
            if trayectorias_csv.exists():
                logger.info(f"Loading {trayectorias_csv}...")
                df_trayectorias = pd.read_csv(trayectorias_csv, on_bad_lines='skip', engine='python')
                for index, row in df_trayectorias.iterrows():
                    try:
                        punto_a_wkt = f"SRID=4326;POINT({row.get('lng_a', -78.5)} {row.get('lat_a', -0.2)})"
                        punto_b_wkt = f"SRID=4326;POINT({row.get('lng_b', -78.5)} {row.get('lat_b', -0.2)})"
                        
                        desaparecido = Desaparecido(
                            nombres=str(row.get('nombres', 'Desconocido')),
                            apellidos=str(row.get('apellidos', 'Desconocido')),
                            fecha_desaparicion=pd.to_datetime(row.get('fecha_desaparicion', datetime.today())).date(),
                            punto_a=punto_a_wkt,
                            punto_b=punto_b_wkt,
                            estado=EstadoCaso.LOCALIZADO,
                            usuario_reportante_id=admin_id,
                            consentimiento_firmado=True
                        )
                        session.add(desaparecido)
                    except Exception as e:
                        logger.warning(f"Error row {index}: {e}")
            else:
                logger.warning(f"File {trayectorias_csv} not found.")

            await session.commit()
            logger.info("Seed completed successfully.")

        except Exception as e:
            logger.error(f"Seeding failed: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed_data())
