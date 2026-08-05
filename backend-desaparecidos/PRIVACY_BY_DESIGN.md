# Privacy by Design y por Defecto — Art. 39 LOPDP

## Documento Formal de Cumplimiento

**Plataforma de Personas Desaparecidas — Distrito Metropolitano de Quito (DMQ)**

Conforme al Art. 39 de la Ley Orgánica de Protección de Datos Personales del Ecuador:

> *"Se entiende a la protección de datos desde el diseño como el deber del responsable del tratamiento de tener en cuenta, en las primeras fases de concepción y diseño del proyecto, que determinados tipos de tratamientos de datos personales entrañan una serie de riesgos para los derechos de los titulares."*

---

## 1. Privacy by Design — Medidas Técnicas Implementadas

### 1.1 Cifrado de Datos Personales (Art. 37.1)

| Tipo de Dato | Técnica de Protección | Algoritmo |
|---|---|---|
| Nombre del denunciante | Cifrado simétrico | AES-256-GCM |
| Email del denunciante | Cifrado simétrico | AES-256-GCM |
| Teléfono del denunciante | Cifrado simétrico | AES-256-GCM |
| Cédula del denunciante | Hash irreversible | Argon2id |
| Contraseña | Hash irreversible | Argon2id |
| Coordenadas geográficas | Sin cifrado (dato público del caso) | N/A |

**Justificación:** Los datos PII del denunciante se cifran ANTES de llegar a la base de datos (cifrado en la capa de servicio). El algoritmo AES-256-GCM proporciona tanto confidencialidad como integridad (autenticación del ciphertext). Los nonces de 12 bytes son generados aleatoriamente para cada operación de cifrado.

### 1.2 Autenticación y Control de Acceso (Art. 37.2)

- **JWT con expiración de 30 minutos:** Los tokens de sesión tienen vida útil corta.
- **RBAC (Role-Based Access Control):** Tres roles (Admin, Familiar, Comunidad) con permisos diferenciados.
- **OAuth 2.0 Bearer:** Esquema estándar de autenticación.

### 1.3 Validación de Identidad

- **Módulo 10 (Cédula ecuatoriana):** Doble validación — frontend (TypeScript) + backend (Python).
- **Rate Limiting:** Máximo 3 registros cada 15 minutos por IP para prevenir abuso.

### 1.4 Auditoría (Art. 47.2)

- **AuditLog:** Tabla dedicada que registra todas las operaciones sobre datos personales.
- **Campos registrados:** usuario_id, acción, detalle (JSON), IP, timestamp.
- **Operaciones auditadas:** REGISTRO_CASO, ARCO_ACCESO, ARCO_RECTIFICACION, ARCO_ELIMINACION, ARCO_OPOSICION, ARCO_PORTABILIDAD, REVOCACION_CONSENTIMIENTO.

---

## 2. Privacy by Default — Medidas Organizativas

### 2.1 Minimización de Datos (Art. 10e)

Solo se recopilan los datos **estrictamente necesarios** para el fin de búsqueda:

- **Del desaparecido:** nombre, edad, sexo, descripción física, ubicación, foto.
- **Del denunciante:** nombre, cédula, email, teléfono (todos cifrados).

No se recopilan: datos financieros, historial médico, filiación política, orientación sexual.

### 2.2 Separación de Datos Públicos y Privados

| Dato | Visibilidad | Justificación |
|---|---|---|
| Nombre del desaparecido | Público (tras aprobación) | Necesario para la búsqueda comunitaria |
| Foto del desaparecido | Público (tras aprobación) | Necesario para identificación visual |
| Coordenadas punto A | Público | Necesario para localización geográfica |
| Datos del denunciante | NUNCA público | PII cifrada con AES-256 |
| Polígonos predictivos | Solo Familiar + Admin | Información sensible de investigación |

### 2.3 Consentimiento Explícito (Art. 8)

- **Checkbox de bloqueo:** El botón de registro está deshabilitado hasta que el usuario marque la Declaración de Consentimiento.
- **No preseleccionado:** El checkbox inicia en estado `false` (principio de opt-in, no opt-out).
- **Consentimiento informado:** El texto incluye los fines específicos, el responsable del tratamiento, el tiempo de conservación y el mecanismo de revocación.

### 2.4 Derecho de Eliminación y Anonimización (Art. 15)

- **Soft delete con anonimización:** Al ejercer el derecho de eliminación, los datos PII se reemplazan por "[DATOS ELIMINADOS]" (cifrado), preservando la integridad referencial.
- **Excepción por interés vital:** Si hay casos activos de búsqueda, la eliminación se posterga conforme al Art. 18.8 (protección de intereses vitales del desaparecido).

---

## 3. Análisis de Riesgos (Art. 40)

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Acceso no autorizado a PII | Media | Alto | AES-256 + JWT + RBAC |
| SQL Injection | Baja | Crítico | Solo ORM (SQLAlchemy), sin SQL crudo |
| XSS en frontend | Baja | Medio | React escapa HTML por defecto |
| Fuerza bruta en login | Media | Alto | Rate Limiting + Argon2 (lento por diseño) |
| Filtración de datos del denunciante | Baja | Crítico | Datos cifrados, nunca expuestos en API pública |
| Uso indebido de IA predictiva | Media | Medio | Disclaimers claros, Art. 20 implementado |

---

## 4. Evaluación de Impacto (Art. 42)

Este tratamiento requiere evaluación de impacto obligatoria porque:

- ✅ Art. 42(a): Se utiliza elaboración de perfiles automatizada (KDE, Markov, RF).
- ✅ Art. 42(b): Se tratan datos de categorías especiales (NNA, datos biométricos/fotos).

**Resultado de la evaluación:** El tratamiento se justifica por interés vital (Art. 7.6) y se implementan medidas de protección proporcionales al riesgo identificado.

---

## 5. Notificación de Vulneraciones (Art. 43, 46)

**Protocolo de respuesta a incidentes:**

1. **Detección:** Monitoreo de logs de auditoría y accesos anómalos.
2. **Clasificación:** Evaluación de impacto sobre derechos del titular.
3. **Notificación a la Autoridad:** Dentro de 5 días (Art. 43).
4. **Notificación al titular:** Dentro de 3 días si hay riesgo para derechos fundamentales (Art. 46).
5. **Remediación:** Implementación de medidas correctivas.

---

*Documento generado como parte de la responsabilidad proactiva y demostrada (Art. 10k LOPDP).*
