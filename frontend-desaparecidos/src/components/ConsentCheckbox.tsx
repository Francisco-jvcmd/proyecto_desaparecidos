'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ConsentCheckboxProps {
  onChange: (checked: boolean) => void;
}

export default function ConsentCheckbox({ onChange }: ConsentCheckboxProps) {
  const [checked, setChecked] = useState(false);
  
  const handleChange = () => {
    const newValue = !checked;
    setChecked(newValue);
    onChange(newValue);
  };
  
  return (
    <div className="consent-wrapper" style={{ marginTop: '24px' }}>
      <label className="consent-container">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          aria-label="Declaración de consentimiento informado conforme a la LOPDP"
        />
        <span className="consent-text">
          <strong>Declaración de Consentimiento Informado (Art. 8, LOPDP):</strong>{' '}
          &ldquo;Declaro bajo juramento que los datos aportados (nombres, número de
          cédula, fotografías, señas particulares y ubicación geográfica) son verídicos
          y que soy familiar o allegado directo de la persona desaparecida. Autorizo de
          manera <strong>libre, específica, informada e inequívoca</strong> el tratamiento, cifrado
          y difusión de estos datos <strong>exclusivamente para los fines de búsqueda,
          geolocalización y modelado analítico predictivo</strong> dentro de esta plataforma,
          conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador
          (R.O. 459, 26-may-2021).&rdquo;
        </span>
      </label>
      
      {/* Información adicional LOPDP — Art. 8, Art. 10(i), Art. 12 */}
      <div style={{ 
        marginTop: '12px', 
        marginLeft: '28px', 
        padding: '12px 16px', 
        background: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '8px', 
        border: '1px solid rgba(59, 130, 246, 0.15)',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.6'
      }}>
        <p>
          <strong>Responsable del tratamiento:</strong> Plataforma de Personas Desaparecidas — DMQ, Ecuador.
        </p>
        <p style={{ marginTop: '6px' }}>
          <strong>Conservación de datos (Art. 10i):</strong> Sus datos serán conservados mientras el caso permanezca activo. 
          Casos archivados: máximo 5 años, luego serán anonimizados.
        </p>
        <p style={{ marginTop: '6px' }}>
          <strong>Revocación (Art. 8):</strong> Puede revocar este consentimiento en cualquier momento 
          sin necesidad de justificación, desde su perfil de usuario o contactando a{' '}
          <strong>protecciondatos@plataforma-dmq.ec</strong>. La revocación no tiene efectos retroactivos.
        </p>
        <p style={{ marginTop: '6px' }}>
          <strong>Sus derechos:</strong> Acceso, rectificación, eliminación, oposición y portabilidad 
          (Art. 13-17 LOPDP). Plazo de respuesta: 15 días.
        </p>
        <p style={{ marginTop: '8px' }}>
          📄 <Link href="/privacidad" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
            Leer la Política de Privacidad completa (17 puntos Art. 12 LOPDP)
          </Link>
        </p>
      </div>
    </div>
  );
}
