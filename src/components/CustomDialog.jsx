import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';

const CustomDialog = () => {
  const { dialog, closeDialog } = useStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog?.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog]);

  if (!dialog) return null;

  const { type, message, onConfirm, onCancel } = dialog;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      closeDialog();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '400px', 
          width: '90%', 
          padding: '1.5rem',
          animation: 'fadeInDown 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          {type === 'alert' && <AlertCircle size={24} style={{ color: 'var(--danger-color)' }} />}
          {type === 'confirm' && <HelpCircle size={24} style={{ color: 'var(--warning-color)' }} />}
          {type === 'prompt' && <Info size={24} style={{ color: 'var(--primary-color)' }} />}
          
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
            {type === 'alert' ? 'Alert' : type === 'confirm' ? 'Confirm' : 'Input Required'}
          </h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>

        {type === 'prompt' && (
          <input
            type="text"
            className="form-control"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{ marginTop: '0.5rem' }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              className="btn" 
              onClick={handleCancel}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          )}
          <button 
            className="btn" 
            onClick={handleConfirm}
            style={{ 
              background: type === 'alert' ? 'var(--danger-color)' : 'var(--primary-color)', 
              color: '#fff', 
              border: 'none',
              minWidth: '80px'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomDialog;
