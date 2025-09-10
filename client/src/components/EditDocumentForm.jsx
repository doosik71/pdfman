import React, { useState } from 'react';

/**
 * A form for editing a document's metadata.
 * @param {object} props - The properties for the component.
 * @param {object} props.doc - The document object to edit.
 * @param {function} props.onSave - Callback function to save the changes.
 * @param {function} props.onCancel - Callback function to cancel editing.
 * @returns {React.ReactElement} The editing form component.
 */
const EditDocumentForm = ({ doc, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: doc.title || '',
    authors: doc.authors.join(', ') || '',
    year: doc.year || '',
    tags: doc.tags.join(', ') || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      // Split comma-separated strings back into arrays
      authors: formData.authors.split(',').map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    onSave(finalData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label>Title:</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>Authors (comma-separated):</label>
        <input type="text" name="authors" value={formData.authors} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>Year:</label>
        <input type="number" name="year" value={formData.year} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>Tags (comma-separated):</label>
        <input type="text" name="tags" value={formData.tags} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>
      
      <div>
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
      </div>
    </form>
  );
};

export default EditDocumentForm;