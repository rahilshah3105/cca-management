import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange, placeholder = 'Select an option', className = '', onAddNew = null, addNewText = 'Add New Player' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
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
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchInput.toLowerCase()));
  const hasMatchingOption = filteredOptions.some(o => o.label.toLowerCase() === searchInput.toLowerCase());

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setSearchInput('');
    setIsOpen(false);
  };

  const handleAddNew = () => {
    const nameToAdd = searchInput.trim() || addNewText;
    onAddNew(nameToAdd);
    setSearchInput('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0].value);
      } else if (onAddNew && searchInput.trim()) {
        handleAddNew();
      }
    }
  };

  return (
    <div className={`custom-select-container ${className}`} ref={dropdownRef}>
      <input
        ref={triggerRef}
        type="text"
        className="form-control"
        placeholder={selectedOption ? selectedOption.label : placeholder}
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        createPortal(
          <div className="custom-select-menu" ref={menuRef} style={{ ...(menuStyle || {}), animation: 'fadeInDown 0.15s ease-out' }}>
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => handleSelectOption(option.value)}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={16} className="check-icon" />}
              </div>
            ))}
            {filteredOptions.length === 0 && !onAddNew && (
              <div className="custom-select-option empty">No options available</div>
            )}
            {onAddNew && searchInput.trim() && !hasMatchingOption && (
              <div
                className="custom-select-option"
                style={{ color: 'var(--primary-color)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 8px 8px', marginTop: '4px', cursor: 'pointer' }}
                onClick={handleAddNew}
              >
                <Plus size={14} style={{ marginRight: '0.5rem' }} />
                Add "{searchInput.trim()}"
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
