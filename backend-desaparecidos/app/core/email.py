import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from app.core.config import get_settings

logger = logging.getLogger("email_service")
settings = get_settings()

def get_verification_email_html(nombre: str, verification_url: str) -> str:
    """
    Genera una plantilla HTML responsive y profesional con la identidad visual de DMQ Desaparecidos.
    """
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta - DMQ Desaparecidos</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #050811;
      margin: 0;
      padding: 0;
      color: #f1f5f9;
    }}
    .container {{
      max-width: 580px;
      margin: 30px auto;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1e3a8a, #0f172a);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .brand {{
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }}
    .content {{
      padding: 36px 32px;
      line-height: 1.6;
    }}
    .greeting {{
      font-size: 18px;
      font-weight: 600;
      color: #38bdf8;
      margin-bottom: 16px;
    }}
    .text {{
      color: #cbd5e1;
      font-size: 15px;
      margin-bottom: 24px;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .btn {{
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0f172a !important;
      font-weight: 700;
      font-size: 16px;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
    }}
    .link-alt {{
      background: rgba(255, 255, 255, 0.03);
      padding: 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      word-break: break-all;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 20px;
    }}
    .link-alt a {{
      color: #38bdf8;
      text-decoration: underline;
    }}
    .security-note {{
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: #64748b;
    }}
    .footer {{
      background: #090d16;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">🔍 DMQ Desaparecidos</div>
      <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Plataforma de Búsqueda y Asistencia Comunitaria</p>
    </div>
    <div class="content">
      <div class="greeting">¡Hola, {nombre}!</div>
      <p class="text">
        Gracias por registrarte en la plataforma de <strong>DMQ Desaparecidos</strong>. Para proteger la seguridad 
        de la información y garantizar la legitimidad de los reportes, por favor confirma tu dirección de correo electrónico.
      </p>
      
      <div class="btn-container">
        <a href="{verification_url}" class="btn" target="_blank">✓ Confirmar y Activar mi Cuenta</a>
      </div>

      <p class="text" style="font-size: 13px; color: #94a3b8;">
        Este enlace es válido por <strong>24 horas</strong>. Una vez confirmado, podrás ingresar a la plataforma 
        con tu correo y contraseña para reportar y hacer seguimiento a casos de personas desaparecidas.
      </p>

      <div class="link-alt">
        ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>
        <a href="{verification_url}">{verification_url}</a>
      </div>

      <div class="security-note">
        🛡️ <strong>Aviso de Seguridad y Privacidad (LOPDP):</strong><br>
        Tus datos personales están cifrados con AES-256-GCM y protegidos conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador. 
        Si no realizaste este registro, puedes ignorar este correo; la cuenta no se activará.
      </div>
    </div>
    <div class="footer">
      Distrito Metropolitano de Quito — Ecuador<br>
      © 2026 Plataforma de Asistencia Tecnológica para Personas Desaparecidas
    </div>
  </div>
</body>
</html>"""


async def send_verification_email(email_destinatario: str, nombre: str, token: str):
    """
    Envía el correo de verificación utilizando SMTP (Gmail), Resend API, o registro en logs.
    Prioriza SMTP sobre Resend para envío a cualquier destinatario.
    """
    import re

    verification_url = f"{settings.FRONTEND_URL}/verificar-email?token={token}"
    html_content = get_verification_email_html(nombre, verification_url)
    subject = "Confirma tu cuenta - Plataforma DMQ Desaparecidos"

    # Extraer dirección de correo pura del formato "Nombre <email@domain.com>"
    def extract_email(from_field: str) -> str:
        match = re.search(r'<(.+?)>', from_field)
        return match.group(1) if match else from_field.strip()

    # 1. PRIORIDAD: Intentar enviar vía SMTP (Gmail) si está configurado
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            logger.info(f"📧 Intentando envío SMTP a {email_destinatario} vía {settings.SMTP_HOST}:{settings.SMTP_PORT}")

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = email_destinatario
            msg.attach(MIMEText(html_content, "html"))

            # Usar dirección pura como envelope sender (Gmail lo requiere)
            sender_email = extract_email(settings.EMAIL_FROM)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, [email_destinatario], msg.as_string())

            logger.info(f"✅ Correo de verificación enviado vía SMTP a {email_destinatario}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Error de autenticación SMTP (contraseña de app incorrecta): {e}")
        except smtplib.SMTPException as e:
            logger.error(f"❌ Error SMTP al enviar correo: {e}")
        except Exception as e:
            logger.error(f"❌ Error inesperado al enviar correo vía SMTP: {type(e).__name__}: {e}")

    # 2. Fallback: Intentar enviar vía Resend API
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY != "placeholder":
        try:
            logger.info(f"📧 Intentando envío Resend API a {email_destinatario}")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": settings.EMAIL_FROM,
                        "to": [email_destinatario],
                        "subject": subject,
                        "html": html_content,
                    },
                )
                if response.status_code in (200, 201):
                    logger.info(f"✅ Correo de verificación enviado vía Resend a {email_destinatario}")
                    return True
                else:
                    logger.warning(f"⚠️ Error Resend API ({response.status_code}): {response.text}")
        except Exception as e:
            logger.error(f"❌ Fallo al conectar con Resend API: {e}")

    # 3. Fallback final: Registrar URL en logs del servidor
    logger.warning("=" * 70)
    logger.warning(f"⚠️ NO SE PUDO ENVIAR CORREO a {email_destinatario}")
    logger.warning(f"📧 [SIMULADOR] Verificación para: {email_destinatario}")
    logger.warning(f"🔗 Enlace de Activación: {verification_url}")
    logger.warning(f"💡 Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD en las variables de entorno")
    logger.warning("=" * 70)
    return False

