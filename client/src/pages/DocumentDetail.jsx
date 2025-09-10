import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

const DocumentDetail = ({ docHash, onBack, onSetDocumentTitle }) => {
  const [details, setDetails] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryExists, setSummaryExists] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      if (!response.ok || !response.body) {
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
                <p>
                  <strong>Authors:</strong> {details.authors.join(', ') || 'N/A'}
                  {details.year && ` • ${details.year}`}
                </p>
                <hr />
                <h3>AI Summary</h3>
                {summaryExists && !isSummarizing ? (
                  <ReactMarkdown>{summary}</ReactMarkdown>
                ) : (
                  <button onClick={handleSummarize} disabled={isSummarizing}>
                    {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
                  </button>
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