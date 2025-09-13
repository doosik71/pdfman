import React from 'react';

/**
 * A header component that can display a title and a back button.
 * @param {object} props - The properties for the component.
 * @param {string} props.title - The title to display in the header.
 * @param {function} props.onBack - Callback function for the back button.
 * @param {string} props.backButtonText - Text for the back button.
 * @returns {React.ReactElement} The Header component.
 */
const Header = ({ title, onBack, backButtonText }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '0rem',
      borderBottom: 'none', 
      height: '0px',
    }}>
      
      {onBack && backButtonText && (
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', marginLeft: 'auto' }}>
          &larr; {backButtonText}
        </button>
      )}
    </div>
  );
};

export default Header;