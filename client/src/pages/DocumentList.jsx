import React, { useState, useEffect, useCallback } from 'react';
import EditDocumentForm from '../components/EditDocumentForm';
import DocumentDetail from './DocumentDetail';

const DocumentList = ({ topicName, onBackToTopics, onSetDocumentTitle }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [editingDocHash, setEditingDocHash] = useState(null);
  const [selectedDocHash, setSelectedDocHash] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const memoizedOnBackToDocumentList = useCallback(() => {
    setSelectedDocHash(null);
    onSetDocumentTitle(''); // Reset documentTitle when going back to document list
  }, [setSelectedDocHash, onSetDocumentTitle]);

  useEffect(() => {
    const loadDocuments = async () => {
      if (topicName && !selectedDocHash) {
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
      }
    };

    loadDocuments();
  }, [topicName, selectedDocHash]);

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
      // After upload, re-fetch documents
      const reFetchDocuments = async () => {
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
      };
      reFetchDocuments();
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
      // After add from URL, re-fetch documents
      const reFetchDocuments = async () => {
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
      };
      reFetchDocuments();
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
      // After delete, re-fetch documents
      const reFetchDocuments = async () => {
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
      };
      reFetchDocuments();
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
      // After save, re-fetch documents
      const reFetchDocuments = async () => {
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
      };
      reFetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const pdfFile = Array.from(files).find(file => file.type === 'application/pdf');
      if (pdfFile) {
        setSelectedFile(pdfFile);
      } else {
        setError('Only PDF files are supported.');
      }
    }
  };

  // Render the Document Detail view if a document is selected
  if (selectedDocHash) {
    return <DocumentDetail docHash={selectedDocHash} onBack={memoizedOnBackToDocumentList} onSetDocumentTitle={onSetDocumentTitle} />;
  }

  // Render the Document List view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <div>
        <button onClick={onBackToTopics} style={{ padding: '0.25rem 0.5rem', flexShrink: 0 }}>&larr; Back to Topics</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {documents.length > 0 ? (
            <ul style={{
              listStyle: 'none',
              padding: 0,
              flexGrow: 1,
              overflowY: 'auto',
              height: 0
            }}>
              {documents.map(doc => (
                <li key={doc.hash} style={{ border: '1px solid #eee', padding: '0.5em 1rem', margin: '0.5em 0', borderRadius: '8px' }}>
                  {editingDocHash === doc.hash ? (
                    <EditDocumentForm
                      doc={doc}
                      onSave={(updatedData) => handleSaveDocument(doc.hash, updatedData)}
                      onCancel={() => setEditingDocHash(null)}
                    />
                  ) : (
                    <>
                      <div style={{ float: 'right' }}>
                        <button onClick={() => setEditingDocHash(doc.hash)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}>Edit</button>
                        <button onClick={() => handleDeleteDocument(doc.hash, doc.title)} style={{ color: 'red', padding: '0.25rem 0.5rem' }}>&times;</button>
                      </div>
                      <h4 onClick={() => setSelectedDocHash(doc.hash)} style={{ cursor: 'pointer', display: 'inline-block' }}>{doc.title}</h4>
                      <p style={{ marginBottom: 0 }}>
                        <span style={{ color: 'gray' }}>{doc.authors.join(', ') || 'N/A'}</span>
                        {doc.year && <span style={{ color: 'dodgerblue' }}>{` • ${doc.year}`}</span>}
                        {doc.tags.length > 0 && ` • ${doc.tags.join(', ')}`}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents found in this topic. Add one below!</p>
          )}
        </>
      )}

      {/* Forms for adding documents */}
      <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
        <div
          style={{
            padding: '0.5rem',
            border: isDraggingOver ? '2px dashed blue' : '1px solid #ccc',
            borderRadius: '8px',
            transition: 'border-color 0.2s ease-in-out',
            flex: 1,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span>Upload New PDF:</span>
          <form onSubmit={handleUploadSubmit}>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <button type="submit" disabled={!selectedFile || loading} style={{ padding: '0.25rem 0.5rem' }}>Upload</button>
            {selectedFile && <p>Selected: {selectedFile.name}</p>}
          </form>
        </div>
        <div
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            flex: 1,
          }}
        >
          <span>Add from URL:</span>
          <form onSubmit={handleAddFromUrlSubmit}>
            <input type="url" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://example.com/document.pdf" style={{ width: '250px' }} />
            <button type="submit" disabled={!pdfUrl || loading} style={{ padding: '0.25rem 0.5rem' }}>Add from URL</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;