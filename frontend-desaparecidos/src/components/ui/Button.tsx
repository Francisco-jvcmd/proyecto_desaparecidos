import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'danger' | 'outline';
  loading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  loading = false, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading ? (
        <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
      ) : (
        children
      )}
    </button>
  );
}
