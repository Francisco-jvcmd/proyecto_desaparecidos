import React from 'react';

type EstadoCaso = 'PENDIENTE' | 'APROBADO' | 'LOCALIZADO' | 'ARCHIVADO';

interface BadgeProps {
  estado: EstadoCaso | string;
  className?: string;
}

export default function Badge({ estado, className = '' }: BadgeProps) {
  let badgeClass = 'badge-archived';
  let displayText = estado;

  switch (String(estado || '').toUpperCase()) {
    case 'PENDIENTE':
      badgeClass = 'badge-pending';
      break;
    case 'APROBADO':
      badgeClass = 'badge-approved';
      break;
    case 'LOCALIZADO':
      badgeClass = 'badge-found';
      break;
    case 'ARCHIVADO':
      badgeClass = 'badge-archived';
      break;
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {displayText}
    </span>
  );
}
