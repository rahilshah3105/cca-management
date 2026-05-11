import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange, placeholder = 'Select an option', className = '', onAddNew = null, addNewText = 'Add New Player' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999
      });
    } else {
      setMenuStyle(null);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-select-container ${className}`} ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
      >
        <span className={!selectedOption ? 'placeholder' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </div>

      {isOpen && (
        // render menu in a portal so it isn't clipped by overflow/stacking parents
        createPortal(
          <div className="custom-select-menu" ref={menuRef} style={{ ...(menuStyle || {}), animation: 'fadeInDown 0.15s ease-out' }}>
            {options.map((option) => (
              <div
                key={option.value}
                className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={16} className="check-icon" />}
              </div>
            ))}
            {options.length === 0 && !onAddNew && (
              <div className="custom-select-option empty">No options available</div>
            )}
            {onAddNew && (
              <div
                className="custom-select-option"
                style={{ color: 'var(--primary-color)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 8px 8px', marginTop: '4px' }}
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
              >
                <span>+ {addNewText}</span>
              </div>
            )}
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default CustomSelect;
