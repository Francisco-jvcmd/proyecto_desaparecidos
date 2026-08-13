from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    AES_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    
    GOOGLE_CLIENT_ID: str = "placeholder"
    GOOGLE_CLIENT_SECRET: str = "placeholder"
    
    CLOUDFLARE_R2_ENDPOINT: str = "placeholder"
    CLOUDFLARE_R2_ACCESS_KEY: str = "placeholder"
    CLOUDFLARE_R2_SECRET_KEY: str = "placeholder"

    # === Email Service (Resend / SMTP) ===
    RESEND_API_KEY: str = "placeholder"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "DMQ Desaparecidos <soporte@desaparecidos.ec>"
    FRONTEND_URL: str = "https://proyecto-desaparecidos.vercel.app"
    
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://proyecto-desaparecidos.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

@lru_cache
def get_settings() -> Settings:
    return Settings()
