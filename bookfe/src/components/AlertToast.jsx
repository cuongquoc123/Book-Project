import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AlertToast({ type = 'error', message = '', style = {} }) {
  if (!message) return null;

  const isError = type === 'error';

  const defaultStyle = {
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.6rem',
    background: isError ? '#FEF2F2' : '#F0FDF4',
    color: isError ? '#DC2626' : '#166534',
    border: `1px solid ${isError ? '#FCA5A5' : '#86EFAC'}`,
    ...style,
  };

  return (
    <div style={defaultStyle} className={`alert-message ${isError ? 'alert-error' : 'alert-success'}`}>
      {isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}
