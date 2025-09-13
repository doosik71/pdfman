import React, { useState } from 'react';

const EditDocumentDetailForm = ({ doc, onSave, onCancel }) => {
  const [title, setTitle] = useState(doc.title);
  const [authors, setAuthors] = useState(doc.authors.join(', '));
  const [year, setYear] = useState(doc.year);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...doc,
      title,
      authors: authors.split(',').map(a => a.trim()),
      year,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ width: '80px', textAlign: 'right', marginRight: "0.5em", flexShrink: 0 }}>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ width: '80px', textAlign: 'right', marginRight: "0.5em", flexShrink: 0 }}>Authors:</label>
        <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} style={{ flex: 1, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ width: '80px', textAlign: 'right', marginRight: "0.5em", flexShrink: 0 }}>Year:</label>
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <button type="submit" style={{ padding: '0.25rem 0.5rem' }}>Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem' }}>Cancel</button>
      </div>
    </form>
  );
};

export default EditDocumentDetailForm;
