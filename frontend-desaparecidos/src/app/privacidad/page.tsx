import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Protección de Datos — DMQ Desaparecidos',
  description: 'Política de privacidad conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, R.O. 459, 26-may-2021).',
};

export default function PoliticaPrivacidad() {
  return (
    <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ 
        padding: '48px 32px', 
        background: 'var(--bg-card)', 
        borderRadius: '16px', 
        border: '1px solid var(--border-glass)',
        marginBottom: '32px'
      }}>
        <h1 style={{ 
          background: 'linear-gradient(135deg, var(--text-primary), var(--color-accent))', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px' 
        }}>
          Política de Privacidad y Protección de Datos Personales
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Conforme a la <strong>Ley Orgánica de Protección de Datos Personales del Ecuador</strong> (LOPDP) — Registro Oficial Suplemento 459, 26 de mayo de 2021.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Última actualización: {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '32px 0' }} />

        {/* === Art. 12.1 — Fines del tratamiento === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>1. Fines del Tratamiento (Art. 12.1)</h2>
          <p>Los datos personales recopilados en esta plataforma serán tratados <strong>exclusivamente</strong> para los siguientes fines:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li>Gestión, registro y difusión de casos de personas desaparecidas en el Distrito Metropolitano de Quito (DMQ).</li>
            <li>Análisis geoespacial predictivo mediante modelos de inteligencia artificial (KDE, Cadenas de Markov, Random Forest) para apoyo en la búsqueda.</li>
            <li>Generación de alertas comunitarias para la localización de personas.</li>
            <li>Generación de estadísticas <strong>anonimizadas</strong> para apoyo en políticas públicas de seguridad ciudadana.</li>
          </ul>
        </section>

        {/* === Art. 12.2 — Base legal === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>2. Base Legal para el Tratamiento (Art. 12.2, Art. 7)</h2>
          <p>El tratamiento de datos personales se fundamenta en:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li><strong>Consentimiento explícito del titular</strong> (Art. 7.1, Art. 8 LOPDP): otorgado mediante la Declaración de Consentimiento e Identidad al momento del registro.</li>
            <li><strong>Protección de intereses vitales</strong> (Art. 7.6 LOPDP): la búsqueda de personas desaparecidas implica la protección de la vida, salud e integridad de la persona.</li>
            <li><strong>Interés público</strong> (Art. 7.4 LOPDP): el tratamiento contribuye a la seguridad ciudadana y al cumplimiento de obligaciones del Estado ecuatoriano.</li>
          </ul>
        </section>

        {/* === Art. 12.3 — Tipos de tratamiento === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>3. Tipos de Tratamiento (Art. 12.3)</h2>
          <p>Los datos personales serán sometidos a los siguientes tipos de tratamiento:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li><strong>Recolección:</strong> mediante formularios web con validación de identidad (Módulo 10).</li>
            <li><strong>Cifrado:</strong> los datos sensibles del denunciante (nombre, email, teléfono, cédula) son cifrados con <strong>AES-256-GCM</strong> antes de su almacenamiento.</li>
            <li><strong>Almacenamiento:</strong> en base de datos PostgreSQL con cifrado en reposo.</li>
            <li><strong>Análisis:</strong> procesamiento geoespacial con modelos de IA para predicción de zonas de búsqueda.</li>
            <li><strong>Difusión controlada:</strong> solo datos públicos (nombre, foto, características) del desaparecido, nunca del denunciante.</li>
          </ul>
        </section>

        {/* === Art. 12.4 — Tiempo de conservación === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>4. Tiempo de Conservación (Art. 12.4, Art. 10i)</h2>
          <div style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            borderRadius: '8px', 
            padding: '16px',
            marginTop: '8px'
          }}>
            <p><strong>Casos activos:</strong> los datos se conservarán mientras el caso de desaparición permanezca activo (estados: Pendiente, Aprobado).</p>
            <p style={{ marginTop: '8px' }}><strong>Casos localizados/archivados:</strong> los datos del desaparecido se conservarán por un máximo de <strong>5 años</strong> con fines estadísticos, tras lo cual serán anonimizados.</p>
            <p style={{ marginTop: '8px' }}><strong>Datos del denunciante:</strong> los datos cifrados del denunciante se conservarán mientras mantenga su cuenta activa. Al revocar su consentimiento o solicitar eliminación, serán suprimidos o anonimizados conforme al Art. 15.</p>
          </div>
        </section>

        {/* === Art. 12.5 — Existencia de base de datos === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>5. Existencia de Base de Datos (Art. 12.5)</h2>
          <p>Los datos personales son almacenados en la base de datos <strong>&ldquo;desaparecidos_db&rdquo;</strong>, operada por la Plataforma de Personas Desaparecidas del DMQ, alojada en servidores dentro del territorio de la República del Ecuador.</p>
        </section>

        {/* === Art. 12.6 — Origen de los datos === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>6. Origen de los Datos (Art. 12.6)</h2>
          <p>Los datos personales son proporcionados <strong>directamente por el titular</strong> (familiar o allegado directo de la persona desaparecida) mediante el formulario de registro de la plataforma.</p>
        </section>

        {/* === Art. 12.7 — Finalidades ulteriores === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>7. Finalidades Ulteriores (Art. 12.7)</h2>
          <p>Los datos podrán ser utilizados con fines de <strong>investigación estadística anonimizada</strong> para el diseño de políticas públicas de seguridad ciudadana, conforme al Art. 10(i) de la LOPDP. En ningún caso los datos personales serán vendidos, cedidos o transferidos a terceros con fines comerciales.</p>
        </section>

        {/* === Art. 12.8 — Identidad del responsable === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>8. Identidad del Responsable del Tratamiento (Art. 12.8)</h2>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px', 
            padding: '16px',
            marginTop: '8px'
          }}>
            <p><strong>Responsable:</strong> Plataforma de Personas Desaparecidas — DMQ</p>
            <p><strong>Dirección:</strong> Distrito Metropolitano de Quito, Pichincha, Ecuador</p>
            <p><strong>Correo electrónico:</strong> protecciondatos@plataforma-dmq.ec</p>
            <p><strong>Teléfono:</strong> +593 (02) XXX-XXXX</p>
          </div>
        </section>

        {/* === Art. 12.9 — Delegado de protección === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>9. Delegado de Protección de Datos (Art. 12.9, Art. 48)</h2>
          <p>Conforme al Art. 48 de la LOPDP, la plataforma designará un Delegado de Protección de Datos Personales. Mientras se realiza dicha designación, las consultas pueden dirigirse al responsable del tratamiento.</p>
        </section>

        {/* === Art. 12.10 — Transferencias === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>10. Transferencias Internacionales (Art. 12.10, Art. 55-57)</h2>
          <p><strong>No se realizan transferencias internacionales de datos personales.</strong> Toda la información es almacenada y procesada dentro del territorio ecuatoriano, garantizando la soberanía de datos.</p>
        </section>

        {/* === Art. 12.11 — Consecuencias === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>11. Consecuencias de la Entrega o Negativa (Art. 12.11)</h2>
          <p>La entrega de datos personales es <strong>voluntaria</strong>. Sin embargo, sin los datos mínimos requeridos (nombre, cédula, ubicación), no será posible registrar el caso de desaparición en la plataforma ni activar los mecanismos de búsqueda.</p>
        </section>

        {/* === Art. 12.12 — Efecto de datos erróneos === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>12. Efecto de Datos Erróneos (Art. 12.12)</h2>
          <p>El suministro de datos inexactos o falsos podría dificultar o impedir la localización de la persona desaparecida. El titular puede rectificar sus datos en cualquier momento mediante el ejercicio del derecho de rectificación (Art. 14).</p>
        </section>

        {/* === Art. 12.13 — Revocación === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>13. Revocación del Consentimiento (Art. 12.13, Art. 8)</h2>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '16px',
            marginTop: '8px'
          }}>
            <p>El titular puede <strong>revocar su consentimiento en cualquier momento</strong>, sin necesidad de justificación, conforme al Art. 8 de la LOPDP.</p>
            <p style={{ marginTop: '8px' }}>Para revocar: acceda a su perfil de usuario y seleccione &ldquo;Revocar Consentimiento&rdquo;, o envíe un correo a <strong>protecciondatos@plataforma-dmq.ec</strong>.</p>
            <p style={{ marginTop: '8px' }}>Conforme al Art. 8, párrafo 3: <em>&ldquo;El tratamiento realizado antes de revocar el consentimiento es lícito, en virtud de que este no tiene efectos retroactivos.&rdquo;</em></p>
          </div>
        </section>

        {/* === Art. 12.14 — Derechos del titular === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>14. Derechos del Titular (Art. 12.14, Art. 13-20)</h2>
          <p>Usted tiene los siguientes derechos sobre sus datos personales:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
            {[
              { icon: '👁️', title: 'Acceso (Art. 13)', desc: 'Conocer qué datos tenemos sobre usted.' },
              { icon: '✏️', title: 'Rectificación (Art. 14)', desc: 'Corregir datos inexactos o incompletos.' },
              { icon: '🗑️', title: 'Eliminación (Art. 15)', desc: 'Solicitar la supresión de sus datos.' },
              { icon: '🚫', title: 'Oposición (Art. 16)', desc: 'Oponerse al tratamiento para fines específicos.' },
              { icon: '📦', title: 'Portabilidad (Art. 17)', desc: 'Recibir sus datos en formato JSON interoperable.' },
              { icon: '⏸️', title: 'Suspensión (Art. 19)', desc: 'Suspender temporalmente el tratamiento.' },
              { icon: '🤖', title: 'No decisión automatizada (Art. 20)', desc: 'No ser objeto de decisiones basadas solo en IA.' },
            ].map((d, i) => (
              <div key={i} style={{ 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                padding: '16px',
                border: '1px solid var(--border-glass)' 
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{d.icon}</div>
                <h4 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>{d.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '16px' }}>Para ejercer cualquier derecho: inicie sesión y acceda a la sección &ldquo;Mis Derechos&rdquo;, o envíe su solicitud a <strong>protecciondatos@plataforma-dmq.ec</strong>. Plazo de respuesta: <strong>15 días</strong> (Art. 13-16 LOPDP).</p>
        </section>

        {/* === Art. 12.15 — Portabilidad === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>15. Mecanismo de Portabilidad (Art. 12.15, Art. 17)</h2>
          <p>Los datos pueden ser exportados en formato <strong>JSON</strong> (estructurado, interoperable y de lectura mecánica) a través del endpoint <code>/api/v1/derechos/portabilidad</code>, accesible con autenticación JWT.</p>
        </section>

        {/* === Art. 12.16 — Reclamos === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>16. Cómo Realizar Reclamos (Art. 12.16)</h2>
          <ul style={{ marginLeft: '24px', lineHeight: '1.8' }}>
            <li><strong>Ante el responsable:</strong> protecciondatos@plataforma-dmq.ec (plazo de respuesta: 10 días, Art. 62)</li>
            <li><strong>Ante la Autoridad de Protección de Datos Personales:</strong> conforme al procedimiento del Art. 64 de la LOPDP y el Código Orgánico Administrativo.</li>
          </ul>
        </section>

        {/* === Art. 12.17 — Decisiones automatizadas === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>17. Decisiones Automatizadas y Perfilamiento (Art. 12.17, Art. 20)</h2>
          <p>Esta plataforma utiliza modelos de inteligencia artificial para:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li><strong>KDE (Kernel Density Estimation):</strong> mapa de calor de zonas con mayor incidencia de desapariciones.</li>
            <li><strong>Cadenas de Markov:</strong> predicción de trayectorias probables basado en datos históricos.</li>
            <li><strong>Random Forest:</strong> clasificación de riesgo por zona geográfica.</li>
          </ul>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', 
            borderRadius: '8px', 
            padding: '16px',
            marginTop: '16px'
          }}>
            <p><strong>⚠️ Importante:</strong> Estos análisis son <strong>orientativos y de apoyo</strong>. NO constituyen decisiones vinculantes ni determinan acciones legales. El titular puede solicitar explicación de los criterios de valoración conforme al Art. 20 de la LOPDP.</p>
          </div>
        </section>

        {/* === Categorías especiales — Art. 25-26 === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>18. Categorías Especiales de Datos (Art. 25-26)</h2>
          <p>La plataforma puede tratar las siguientes categorías especiales:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li><strong>Datos de NNA (Art. 25b, Art. 21):</strong> cuando la persona desaparecida es menor de 18 años, se requiere que el reporte sea realizado por un representante legal debidamente identificado.</li>
            <li><strong>Datos biométricos (Art. 25a):</strong> las fotografías se utilizan exclusivamente para fines de identificación y búsqueda.</li>
          </ul>
        </section>

        {/* === Seguridad — Art. 37 === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>19. Medidas de Seguridad (Art. 37)</h2>
          <p>Implementamos las siguientes medidas técnicas y organizativas:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li><strong>Cifrado AES-256-GCM:</strong> todos los datos personales del denunciante.</li>
            <li><strong>Hashing Argon2:</strong> contraseñas y cédulas (irreversible).</li>
            <li><strong>JWT con expiración:</strong> tokens de sesión de 30 minutos.</li>
            <li><strong>Rate Limiting:</strong> máximo 3 registros cada 15 minutos.</li>
            <li><strong>RBAC:</strong> control de acceso basado en roles (Admin, Familiar, Comunidad).</li>
            <li><strong>Auditoría:</strong> registro de todas las operaciones sobre datos personales.</li>
            <li><strong>HTTPS/TLS:</strong> cifrado en tránsito obligatorio en producción.</li>
          </ul>
        </section>

        {/* === Notificación de vulneración — Art. 43, 46 === */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>20. Notificación de Vulneraciones (Art. 43, 46)</h2>
          <p>En caso de vulneración a la seguridad de los datos personales:</p>
          <ul style={{ marginLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li>Se notificará a la <strong>Autoridad de Protección de Datos Personales</strong> y a la <strong>ARCOTEL</strong> dentro de los <strong>5 días</strong> siguientes (Art. 43).</li>
            <li>Se notificará al <strong>titular</strong> afectado dentro de los <strong>3 días</strong> siguientes cuando exista riesgo para sus derechos fundamentales (Art. 46).</li>
          </ul>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '32px 0' }} />

        <section>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>Marco Normativo Aplicable</h2>
          <ul style={{ marginLeft: '24px', lineHeight: '1.8' }}>
            <li>Constitución de la República del Ecuador — Art. 66, numeral 19</li>
            <li>Ley Orgánica de Protección de Datos Personales (LOPDP) — R.O. 459, 26-may-2021</li>
            <li>Código Orgánico Administrativo (COA)</li>
            <li>Ley Orgánica de Telecomunicaciones — Art. 78</li>
          </ul>
        </section>

        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center', 
          padding: '24px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '8px' 
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿Tiene preguntas sobre sus datos personales?
          </p>
          <p style={{ marginTop: '8px' }}>
            <strong>protecciondatos@plataforma-dmq.ec</strong>
          </p>
          <p style={{ marginTop: '16px' }}>
            <Link href="/" style={{ color: 'var(--color-accent)' }}>← Volver al inicio</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
