import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseInputProps {
  label: string;
  error?: string;
  className?: string;
  multiline?: boolean;
}

type InputProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Input(props: InputProps | TextareaProps) {
  // Destructure multiline separately to avoid passing it to DOM elements
  const { label, error, className = '', multiline, ...rest } = props as BaseInputProps & Record<string, any>;
  const inputId = rest.name || rest.id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`input-group ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      {multiline ? (
        <textarea 
          id={inputId}
          className="input-field" 
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} 
        />
      ) : (
        <input 
          id={inputId}
          className="input-field" 
          {...(rest as InputHTMLAttributes<HTMLInputElement>)} 
        />
      )}
      {error && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }} role="alert">{error}</span>}
    </div>
  );
}
