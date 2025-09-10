import React, { useState, useEffect, useCallback } from 'react';

const DocumentDetail = ({ docHash, onBack }) => {
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

      // Fetch document details and summary in parallel
      const [detailsRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:3000/api/documents/${docHash}`),
        fetch(`http://localhost:3000/api/summaries/${docHash}`)
      ]);

      if (!detailsRes.ok) {
        throw new Error(`Failed to fetch document details: ${detailsRes.status}`);
      }
      const detailsData = await detailsRes.json();
      setDetails(detailsData);

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
  }, [docHash]);

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
    <div>
      <button onClick={onBack}>&larr; Back to Document List</button>
      {loading && <p>Loading document details...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {details && (
        <>
          <h2>{details.title}</h2>
          <div style={{ display: 'flex', height: '80vh', marginTop: '1rem' }}>
            <div style={{ flex: 1, border: '1px solid #ccc', marginRight: '1rem' }}>
              <embed
                src={`http://localhost:3000/api/pdfs/${docHash}`}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            </div>
            <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem', overflowY: 'auto' }}>
              <h3>Metadata</h3>
              <p><strong>Authors:</strong> {details.authors.join(', ') || 'N/A'}</p>
              <p><strong>Year:</strong> {details.year || 'N/A'}</p>
              <p><strong>Tags:</strong> {details.tags.join(', ') || 'N/A'}</p>
              <hr />
              <h3>AI Summary</h3>
              {summaryExists && !isSummarizing ? (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{summary}</pre>
              ) : (
                <button onClick={handleSummarize} disabled={isSummarizing}>
                  {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
                </button>
              )}
              {isSummarizing && <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{summary}</pre>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentDetail;