import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import EditDocumentDetailForm from '../components/EditDocumentDetailForm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

const DocumentDetail = ({ docHash, onBack, onSetDocumentTitle }) => {
  const [details, setDetails] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryExists, setSummaryExists] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailsRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:3000/api/documents/${docHash}`),
        fetch(`http://localhost:3000/api/summaries/${docHash}`)
      ]);

      if (!detailsRes.ok) {
        throw new Error(`Failed to fetch document details: ${detailsRes.status}`);
      }
      const detailsData = await detailsRes.json();
      setDetails(detailsData);
      if (onSetDocumentTitle) {
        onSetDocumentTitle(detailsData.title);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.text();
        setSummary(summaryData);
        setSummaryExists(true);
      } else {
        setSummaryExists(false);
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [docHash, onBack, onSetDocumentTitle]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true);
      setSummary('');
      setError(null);

      const response = await fetch(`http://localhost:3000/api/summarize/${docHash}`, { method: 'POST' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to start summary stream: ${response.status}`);
      }
      if (!response.body) {
        throw new Error(`Failed to start summary stream: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setSummary(prev => prev + chunk);
      }

      setSummaryExists(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (window.confirm('Are you sure you want to delete this summary?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/summaries/${docHash}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete summary: ${response.status}`);
        }

        setSummary('');
        setSummaryExists(false);
        alert('Summary deleted successfully!');
      } catch (e) {
        setError(e.message);
        alert(`Error deleting summary: ${e.message}`);
      }
    }
  };

  const handleSave = async (updatedDetails) => {
    try {
      const response = await fetch(`http://localhost:3000/api/documents/${docHash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDetails),
      });
      if (!response.ok) {
        throw new Error('Failed to save document details');
      }
      setDetails(updatedDetails);
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div id="document-detail-area" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 62px)' }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>&larr; Back to Document List</button>
      {loading && <p>Loading document details...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {details && (
        <>
          <PanelGroup direction="horizontal" style={{ flexGrow: 1 }}>
            <Panel defaultSize={50} minSize={20}>
              <div style={{
                flex: 1,
                border: '1px solid #ccc',
                height: '100%'
              }}>
                <embed
                  src={`http://localhost:3000/api/pdfs/${docHash}`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
              </div>
            </Panel>
            <PanelResizeHandle style={{ width: '5px', background: '#ccc', cursor: 'ew-resize' }} />
            <Panel defaultSize={50} minSize={20}>
              <div id="document-summary-panel" style={{
                flex: 1,
                border: '1px solid #ccc',
                padding: '1rem',
                height: '100%',
                overflowY: 'auto'
              }}>
                {isEditing ? (
                  <EditDocumentDetailForm doc={details} onSave={handleSave} onCancel={() => setIsEditing(false)} />
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>{details.title}</h3>
                      <button onClick={() => setIsEditing(true)}>Edit</button>
                    </div>
                    <p>
                      <strong>Authors:</strong> {details.authors.join(', ') || 'N/A'}
                      {details.year && ` • ${details.year}`}
                    </p>
                  </>
                )}
                <hr />
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  AI Summary
                  {summaryExists && !isSummarizing && (
                    <button onClick={handleDeleteSummary} style={{ fontSize: '0.8em', padding: '0.3em 0.6em' }}>
                      Delete Summary
                    </button>
                  )}
                </h3>
                {summaryExists && !isSummarizing ? (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>{summary}</ReactMarkdown>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={handleSummarize} disabled={isSummarizing}>
                      {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
                    </button>
                  </div>
                )}
                {isSummarizing && <ReactMarkdown>{summary}</ReactMarkdown>}
              </div>
            </Panel>
          </PanelGroup>
        </>
      )}
    </div>
  );
};

export default DocumentDetail;