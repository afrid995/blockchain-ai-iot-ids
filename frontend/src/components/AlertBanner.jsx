import React from 'react';

export function AlertBanner({ type = 'danger', message, onDismiss = null }) {
  if (!message) return null;

  const alertClass = `alert alert-${type}`;

  return (
    <div className={alertClass} role="alert" data-testid="alert-banner">
      <div style={{ flex: 1 }}>{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginLeft: '0.5rem',
          }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
