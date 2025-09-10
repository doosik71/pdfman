
import React, { useState, useEffect, useCallback } from 'react';
import EditDocumentForm from '../components/EditDocumentForm';
import DocumentDetail from './DocumentDetail';

const DocumentList = ({ topicName, onBack }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [editingDocHash, setEditingDocHash] = useState(null);
  const [selectedDocHash, setSelectedDocHash] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/topics/${topicName}/documents`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDocuments(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [topicName]);

  useEffect(() => {
    if (topicName && !selectedDocHash) {
      fetchDocuments();
    }
  }, [topicName, selectedDocHash, fetchDocuments]);

  const handleFileChange = (e) => {
    if (e.target.files) setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return setError('Please select a file to upload.');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/topics/${topicName}/documents/upload`, { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `File upload failed. Status: ${response.status}`);
      }
      setSelectedFile(null);
      e.target.reset();
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromUrlSubmit = async (e) => {
    e.preventDefault();
    if (!pdfUrl.trim()) return setError('Please enter a URL.');
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/topics/${topicName}/documents/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pdfUrl }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to add from URL. Status: ${response.status}`);
      }
      setPdfUrl('');
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (hash, title) => {
    if (!window.confirm(`Are you sure you want to delete the document "${title}"?`)) return;
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/documents/${hash}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to delete document. Status: ${response.status}`);
      }
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async (hash, updatedData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/documents/${hash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to update document. Status: ${response.status}`);
      }
      setEditingDocHash(null);
      await fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render the Document Detail view if a document is selected
  if (selectedDocHash) {
    return <DocumentDetail docHash={selectedDocHash} onBack={() => setSelectedDocHash(null)} />;
  }

  // Render the Document List view
  return (
    <div>
      <button onClick={onBack}>&larr; Back to Topics</button>
      <h2>Documents for: {topicName}</h2>
      
      {/* Forms for adding documents */}
      <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0'}}>
        <div style={{padding: '1rem', border: '1px solid #ccc', borderRadius: '8px'}}>
          <h3>Upload New PDF</h3>
          <form onSubmit={handleUploadSubmit}>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <button type="submit" disabled={!selectedFile || loading} style={{marginTop: '0.5rem'}}>Upload</button>
          </form>
        </div>
        <div style={{padding: '1rem', border: '1px solid #ccc', borderRadius: '8px'}}>
          <h3>Add from URL</h3>
          <form onSubmit={handleAddFromUrlSubmit}>
            <input type="url" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://example.com/document.pdf" style={{width: '250px'}}/>
            <button type="submit" disabled={!pdfUrl || loading} style={{marginTop: '0.5rem'}}>Add from URL</button>
          </form>
        </div>
      </div>
      <hr />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <h3>Document List</h3>
          {documents.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {documents.map(doc => (
                <li key={doc.hash} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                  {editingDocHash === doc.hash ? (
                    <EditDocumentForm 
                      doc={doc} 
                      onSave={(updatedData) => handleSaveDocument(doc.hash, updatedData)} 
                      onCancel={() => setEditingDocHash(null)} 
                    />
                  ) : (
                    <>
                      <div style={{float: 'right'}}>
                         <button onClick={() => setEditingDocHash(doc.hash)} style={{marginRight: '0.5rem'}}>Edit</button>
                         <button onClick={() => handleDeleteDocument(doc.hash, doc.title)} style={{color: 'red'}}>&times;</button>
                      </div>
                      <h4 onClick={() => setSelectedDocHash(doc.hash)} style={{cursor: 'pointer', display: 'inline-block'}}>{doc.title}</h4>
                      <p><strong>Authors:</strong> {doc.authors.join(', ') || 'N/A'}</p>
                      <p><strong>Year:</strong> {doc.year || 'N/A'}</p>
                      <p><strong>Tags:</strong> {doc.tags.join(', ') || 'N/A'}</p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents found in this topic.</p>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentList;
