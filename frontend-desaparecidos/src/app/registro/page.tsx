import React from 'react';
import RegistroForm from '@/components/forms/RegistroForm';

export default function RegistroPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Registrar Caso de Desaparición</h1>
        <p>Complete el formulario con información veraz y precisa para activar la búsqueda.</p>
      </div>
      
      <div className="glass-card" style={{ padding: '32px' }}>
        <RegistroForm />
      </div>
    </div>
  );
}
