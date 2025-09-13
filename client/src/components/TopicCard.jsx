
import React, { useState } from 'react';

/**
 * A component to display a single topic card.
 * @param {object} props - The properties for the component.
 * @param {object} props.topic - The topic object.
 * @param {function} props.onDelete - Callback function to delete the topic.
 * @param {function} props.onSelect - Callback function to select the topic (navigate to documents).
 * @returns {React.ReactElement} The topic card component.
 */
const TopicCard = ({ topic, onDelete, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    position: 'absolute',
    top: '-1rem',
    right: '-0.2em',
    background: 'none',
    border: 'none',
    color: isHovered ? 'red' : 'pink',
    cursor: 'pointer',
    fontSize: '1.4rem',
    padding: '0.5rem',
    transition: 'color 0.2s ease-in-out',
  };

  return (
    <div key={topic.name} style={{ position: 'relative', border: '1px solid #ccc', padding: '0.5rem 0.75rem', borderRadius: '8px', flex: '0 0 200px', maxWidth: 'calc(100% - 1rem)', minHeight: '4em' }}>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(topic.name); }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={buttonStyle}
        aria-label={`Delete topic ${topic.name}`}
      >
        &times;
      </button>
      <div onClick={() => onSelect(topic.name)} style={{ cursor: 'pointer' }}>
        <h3>{topic.name}</h3>
        <p style={{ position: 'absolute', bottom: '0rem', right: '0.5rem', fontSize: '0.9em', color: 'dodgerblue' }}>
          {topic.doc_count}
        </p>
      </div>
    </div>
  );
};

export default TopicCard;
