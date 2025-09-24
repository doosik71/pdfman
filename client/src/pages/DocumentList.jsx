import React, { useState, useEffect, useCallback } from 'react';
import EditDocumentForm from '../components/EditDocumentForm';
import DocumentDetail from './DocumentDetail';
import { API_BASE_URL } from '../api';

const DocumentList = ({ topicName, onBackToTopics, onSetDocumentTitle, onTopicNameChange }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [editingDocHash, setEditingDocHash] = useState(null);
  const [selectedDocHash, setSelectedDocHash] = useState(null);
  const [highlightedDocHash, setHighlightedDocHash] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState(topicName);
  const [filterText, setFilterText] = useState('');

  const memoizedOnBackToDocumentList = useCallback((docHash) => {
    setSelectedDocHash(null);
    if (docHash) {
      setHighlightedDocHash(docHash);
    }
    onSetDocumentTitle(''); // Reset documentTitle when going back to document list
  }, [setSelectedDocHash, onSetDocumentTitle]);

  const loadDocuments = useCallback(async () => {
    if (topicName) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/topics/${topicName}/documents`);
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
  }, [topicName]);

  useEffect(() => {
    if (!selectedDocHash) {
      loadDocuments();
    }
  }, [topicName, selectedDocHash, loadDocuments]);

  useEffect(() => {
    if (highlightedDocHash) {
      const highlightedElement = document.querySelector(`.document-item.highlight`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const timer = setTimeout(() => {
        setHighlightedDocHash(null);
      }, 1500); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [highlightedDocHash, documents]);

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
      const response = await fetch(`${API_BASE_URL}/api/topics/${topicName}/documents/upload`, { method: 'POST', body: formData });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `File upload failed. Status: ${response.status}`);
      }

      if (data.duplicate) {
        // If duplicate, navigate to the document detail page
        setSelectedDocHash(data.doc.hash);
      } else {
        // If new document was created, refetch the list
        setSelectedFile(null);
        if (e.target) e.target.reset();
        await loadDocuments();
      }
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
      const response = await fetch(`${API_BASE_URL}/api/topics/${topicName}/documents/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pdfUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to add from URL. Status: ${response.status}`);
      }

      if (data.duplicate) {
        setSelectedDocHash(data.doc.hash);
      } else {
        setPdfUrl('');
        await loadDocuments();
      }
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
      const response = await fetch(`${API_BASE_URL}/api/documents/${hash}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to delete document. Status: ${response.status}`);
      }
      await loadDocuments();
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
      const response = await fetch(`${API_BASE_URL}/api/documents/${hash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to update document. Status: ${response.status}`);
      }
      setEditingDocHash(null);
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopicName = async () => {
    const invalidChars = /[/\\?%*:|"<>.\\]/;
    if (invalidChars.test(newTopicName)) {
      setError('Topic name contains invalid characters.');
      return;
    }
    if (newTopicName === topicName) {
      setIsEditingTopic(false);
      return;
    }
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/topics/${topicName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newName: newTopicName }),
        });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to rename topic.');
      }
      onTopicNameChange(newTopicName);
      setIsEditingTopic(false);
    } catch (err) {
      setError(err.message);
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

  const filteredDocuments = documents.filter(doc => {
    const searchTerm = filterText.toLowerCase();
    return (
      doc.title.toLowerCase().includes(searchTerm) ||
      (doc.authors && doc.authors.join(', ').toLowerCase().includes(searchTerm)) ||
      (doc.tags && doc.tags.join(', ').toLowerCase().includes(searchTerm))
    );
  });

  // Render the Document Detail view if a document is selected
  if (selectedDocHash) {
    return <DocumentDetail docHash={selectedDocHash} onBack={memoizedOnBackToDocumentList} onSetDocumentTitle={onSetDocumentTitle} />;
  }

  // Render the Document List view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <div>
        <button onClick={onBackToTopics} style={{ padding: '0.25rem 0.5rem', marginLeft: '1em', flexShrink: 0 }}>&larr; Back to Topics</button>
      </div>

      {isEditingTopic ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem' }}>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            style={{ fontSize: '1.5rem' }}
          />
          <button onClick={handleUpdateTopicName} style={{ padding: '0.25rem 0.5rem' }}>Save</button>
          <button onClick={() => { setIsEditingTopic(false); setError(null); }} style={{ padding: '0.25rem 0.5rem' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', margin: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{topicName}</h2>
            <button onClick={() => { setIsEditingTopic(true); setNewTopicName(topicName); }} style={{ padding: '0.25rem 0.5rem' }}>Edit</button>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Filter documents..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ paddingRight: '20px' }}
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '1rem',
                  lineHeight: '1'
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {filteredDocuments.length > 0 ? (
            <ul style={{
              listStyle: 'none',
              padding: '0.5rem',
              flexGrow: 1,
              overflowY: 'auto',
              margin: 0,
              height: 0
            }}>
              {filteredDocuments.map(doc => {
                const isHighlighted = doc.hash === highlightedDocHash;
                const itemClassName = `document-item ${isHighlighted ? 'highlight' : ''}`.trim();
                return (
                  <li key={doc.hash} className={itemClassName}>
                    {editingDocHash === doc.hash ? (
                      <EditDocumentForm
                        doc={doc}
                        onSave={(updatedData) => handleSaveDocument(doc.hash, updatedData)}
                        onCancel={() => setEditingDocHash(null)}
                      />
                    ) : (
                      <>
                        <div style={{ float: 'right' }}>
                          <button onClick={() => setEditingDocHash(doc.hash)} style={{ padding: '0 1em', marginBottom: '0.2em' }}>Edit</button>
                          <br />
                          <button onClick={() => handleDeleteDocument(doc.hash, doc.title)} style={{ color: 'red', padding: '0 0.45em' }}>Delete</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ flexShrink: 0 }}>
                            <span style={{ color: 'dodgerblue', fontWeight: 'bold' }}>{doc.year || 'N/A'}</span>
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <h4 onClick={() => setSelectedDocHash(doc.hash)} style={{ cursor: 'pointer', margin: 0, display: 'inline-block' }}>{doc.title}</h4>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'gray' }}>
                              {doc.authors.join(', ') || 'N/A'}
                            </p>
                            {doc.tags.length > 0 && (
                              <p style={{ margin: '0.25rem 0 0 0' }}>
                                {doc.tags.map(tag => (
                                  <span key={tag} style={{ backgroundColor: '#eee', color: '#333', padding: '2px 6px', borderRadius: '4px', marginRight: '5px', fontSize: '0.9em' }}>
                                    {tag}
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>No documents found in this topic. Add one below!</p>
          )}
        </>
      )}

      {/* Forms for adding documents */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, margin: '0.5rem' }}>
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
          <form onSubmit={handleUploadSubmit} style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ flexGrow: 1 }} />
              <button type="submit" disabled={!selectedFile || loading} style={{ padding: '0 0.5rem' }}>Upload</button>
            </div>
            {selectedFile && <p style={{ margin: '0.5rem 0 0 0' }}>Selected: {selectedFile.name}</p>}
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
          <form onSubmit={handleAddFromUrlSubmit} style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="url" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://example.com/document.pdf" style={{ flexGrow: 1, width: '100%', boxSizing: 'border-box' }} />
              <button type="submit" disabled={!pdfUrl || loading} style={{ padding: '0 0.5rem' }}>Add</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;