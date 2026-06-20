import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({ options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div 
        className={`custom-dropdown-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selected}</span>
        <span className={`custom-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <div className="custom-dropdown-list-container">
          <ul className="custom-dropdown-list">
            {options.map((option) => (
              <li 
                key={option} 
                className={`custom-dropdown-list-item ${selected === option ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
