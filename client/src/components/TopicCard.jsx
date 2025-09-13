import React, { useState } from 'react';

/**
 * A component to display a single topic card with a clean, modern design.
 * @param {object} props - The properties for the component.
 * @param {object} props.topic - The topic object.
 * @param {function} props.onDelete - Callback function to delete the topic.
 * @param {function} props.onSelect - Callback function to select the topic (navigate to documents).
 * @returns {React.ReactElement} The topic card component.
 */
const TopicCard = ({ topic, onDelete, onSelect }) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const cardStyle = {
    position: 'relative',
    padding: '0.5rem',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: isCardHovered ? '0 8px 16px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.05)',
    transform: isCardHovered ? 'translateY(-4px)' : 'none',
    transition: 'transform 0.2s ease-in-out, boxShadow 0.2s ease-in-out',
    flex: '0 0 200px',
    maxWidth: 'calc(100% - 1rem)',
    minHeight: '6em',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
  };

  const deleteButtonStyle = {
    display: isCardHovered ? 'block' : 'none',
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    color: isButtonHovered ? '#e53e3e' : '#aaa', // Red on hover, gray otherwise
    cursor: 'pointer',
    fontSize: '1.2rem',
    padding: '0.25rem',
    lineHeight: 1,
    transition: 'color 0.2s ease-in-out',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#333',
  };

  const docCountStyle = {
    alignSelf: 'flex-end',
    backgroundColor: '#eef2f7',
    color: '#4a5568',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      onClick={() => onSelect(topic.name)}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(topic.name); }}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        style={deleteButtonStyle}
        aria-label={`Delete topic ${topic.name}`}
      >
        &times;
      </button>
      
      <h3 style={titleStyle}>{topic.name}</h3>
      
      <p style={docCountStyle}>
        {topic.doc_count} docs
      </p>
    </div>
  );
};

export default TopicCard;
