import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import DocumentList from './pages/DocumentList';
import './App.css';

/**
 * The main application component that manages view state.
 * @returns {React.ReactElement} The App component.
 */
function App() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/topics');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTopics(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTopic) {
      fetchTopics();
    }
  }, [selectedTopic, fetchTopics]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      const response = await fetch('http://localhost:3000/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName: newTopicName }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to create topic. Status: ${response.status}`);
      }
      setNewTopicName('');
      await fetchTopics();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTopic = async (topicName) => {
    if (!window.confirm(`Are you sure you want to delete the topic "${topicName}"?`)) return;
    try {
      const response = await fetch(`http://localhost:3000/api/topics/${topicName}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to delete topic. Status: ${response.status}`);
      }
      await fetchTopics();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderTopicList = () => (
    <>
      <h1>Topic List</h1>
      {loading && <p>Loading topics...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          {topics.length > 0 ? (
            topics.map(topic => (
              <div key={topic.name} style={{ position: 'relative', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', width: '200px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.name); }}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2rem' }}
                  aria-label={`Delete topic ${topic.name}`}
                >
                  &times;
                </button>
                <div onClick={() => setSelectedTopic(topic.name)} style={{ cursor: 'pointer' }}>
                  <h3>{topic.name}</h3>
                  <p>Documents: {topic.doc_count}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No topics found. Add one below!</p>
          )}
        </div>
      )}
      <hr />
      <form onSubmit={handleCreateTopic}>
        <h2>Add New Topic</h2>
        <input
          type="text"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          placeholder="Enter new topic name"
          style={{ marginRight: '1rem' }}
        />
        <button type="submit">Add Topic</button>
      </form>
    </>
  );

  return (
    <Layout>
      {selectedTopic ? (
        <DocumentList 
          topicName={selectedTopic} 
          onBack={() => setSelectedTopic(null)} 
        />
      ) : (
        renderTopicList()
      )}
    </Layout>
  );
}

export default App;