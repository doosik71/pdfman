import React, { useState, useEffect, useCallback } from 'react';
import TopicCard from '../components/TopicCard';
import { API_BASE_URL } from '../api';

/**
 * A component to display and manage the list of topics.
 * @param {object} props - The properties for the component.
 * @param {function} props.onNavigate - Function to handle navigation to other views.
 * @returns {React.ReactElement} The TopicList component.
 */
const TopicList = ({ onNavigate }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [filterText, setFilterText] = useState('');

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/topics`);
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
    fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/topics`, {
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
      window.alert(err.message);
    }
  };

  const handleDeleteTopic = async (topicName) => {
    if (!window.confirm(`Are you sure you want to delete the topic "${topicName}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/topics/${topicName}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to delete topic. Status: ${response.status}`);
      }
      await fetchTopics();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      {loading && <p>Loading topics...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 1rem 1rem 1rem' }}>
        <form onSubmit={handleCreateTopic}>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Enter new topic name"
            style={{ marginRight: '1rem' }}
          />
          <button type="submit" style={{ padding: '0.25rem 0.5rem' }}>Add Topic</button>
        </form>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Filter topics..."
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
      {!loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
          {filteredTopics.length > 0 ? (
            filteredTopics.map(topic => (
              <TopicCard
                key={topic.name}
                topic={topic}
                onDelete={handleDeleteTopic}
                onSelect={(topicName) => onNavigate('documents', topicName)}
              />
            ))
          ) : (
            <p>No topics found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicList;