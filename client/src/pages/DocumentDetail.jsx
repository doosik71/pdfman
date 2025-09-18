import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import EditDocumentDetailForm from '../components/EditDocumentDetailForm';
import ChatInput from '../components/ChatInput';
import ChatDisplay from '../components/ChatDisplay';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import { API_BASE_URL } from '../api';

const DocumentDetail = ({ docHash, onBack, onSetDocumentTitle }) => {
  const [details, setDetails] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryExists, setSummaryExists] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/documents/${docHash}`),
        fetch(`${API_BASE_URL}/api/summaries/${docHash}`)
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

      const response = await fetch(`${API_BASE_URL}/api/summarize/${docHash}`, { method: 'POST' });
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
        const response = await fetch(`${API_BASE_URL}/api/summaries/${docHash}`, {
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

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsChatting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/${docHash}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to get chat response: ${response.status}`);
      }

      if (!response.body) {
        throw new Error(`Failed to get chat response: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      setChatMessages(prev => [...prev, { sender: 'ai', text: '' }]); // Add an empty AI message to be filled

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = aiResponse; // Update the last AI message
          return newMessages;
        });
      }
    } catch (e) {
      console.error("Chat error:", e);
      setChatMessages(prev => [...prev, { sender: 'ai', text: `Error: ${e.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  const handleSave = async (updatedDetails) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docHash}`, {
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
    <div id="document-detail-area" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 16px)' }}>
      <button onClick={() => onBack(docHash)} style={{ alignSelf: 'flex-start', padding: '0.25rem 0.5rem', marginLeft: '1em', marginBottom: '0.5em', flexShrink: 0 }}>&larr; Back to Document List</button>
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
                  src={`${API_BASE_URL}/api/pdfs/${docHash}`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
              </div>
            </Panel>
            <PanelResizeHandle style={{
              width: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              cursor: 'ew-resize',
              transition: 'background-color 0.2s ease-in-out',
            }}>
              <div style={{
                width: '2px',
                height: '30px',
                backgroundColor: '#ccc',
                borderRadius: '1px',
                transition: 'background-color 0.2s ease-in-out',
              }} />
            </PanelResizeHandle>
            <Panel defaultSize={50} minSize={20}>
              <div id="document-summary-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ccc',
                // padding: '1rem',
                height: '100%',
                overflowY: 'auto'
              }}>
                {isEditing ? (
                  <EditDocumentDetailForm doc={details} onSave={handleSave} onCancel={() => setIsEditing(false)} />
                ) : (
                  <>
                    <div style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>{details.title}</h3>
                        <button onClick={() => setIsEditing(true)}>Edit</button>
                      </div>
                      <p>
                        {(details.authors || []).join(', ')}
                        {details.year && ` (${details.year})`}
                      </p>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                  <button
                    onClick={() => setActiveTab('summary')}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: 'none',
                      borderBottom: activeTab === 'summary' ? '3px solid #007bff' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: activeTab === 'summary' ? 'bold' : 'normal',
                      color: activeTab === 'summary' ? '#007bff' : '#333',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      borderRadius: '0',
                    }}
                  >
                    Document Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: 'none',
                      borderBottom: activeTab === 'chat' ? '3px solid #007bff' : '3px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: activeTab === 'chat' ? 'bold' : 'normal',
                      color: activeTab === 'chat' ? '#007bff' : '#333',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      borderRadius: '0',
                    }}
                  >
                    Q&A
                  </button>
                </div>

                <div style={{ display: 'flex', flexGrow: 1, padding: '0.5rem 1rem' }}>
                  {activeTab === 'summary' && (
                    <div style={{ flexGrow: 1, overflowY: 'auto' }}>
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
                  )}

                  {activeTab === 'chat' && (
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        AI Chat
                        {chatMessages.length > 0 && (
                          <button onClick={handleClearChat} style={{ fontSize: '0.8em', padding: '0.3em 0.6em' }}>
                            Clear Chat
                          </button>
                        )}
                      </h3>
                      <ChatDisplay messages={chatMessages} />
                      <ChatInput onSendMessage={handleSendMessage} isChatting={isChatting} />
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </>
      )}
    </div>
  );
};

export default DocumentDetail;