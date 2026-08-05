'use client';

export default function LegalDisclaimer() {
  return (
    <div className="legal-disclaimer" role="alert">
      <p>
        <span className="warning-icon">⚠️</span>
        <strong>AVISO LEGAL Y OFICIAL:</strong>
      </p>
      <p>
        &ldquo;El registro de un caso en esta plataforma digital es una herramienta
        de asistencia tecnológica, analítica y de apoyo comunitario.{' '}
        <strong>EN NINGÚN CASO reemplaza, sustituye ni exime</strong> al ciudadano
        de la obligación de presentar la denuncia formal de desaparición ante la{' '}
        <strong>Fiscalía General del Estado</strong>, la{' '}
        <strong>Policía Nacional del Ecuador</strong> o la{' '}
        <strong>DINASED</strong>. Si su familiar acaba de desaparecer,
        comuníquese de inmediato con el <strong>ECU-911</strong> o acuda a la
        unidad policial más cercana.&rdquo;
      </p>
    </div>
  );
}
