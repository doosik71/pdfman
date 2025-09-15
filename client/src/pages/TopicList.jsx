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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      {loading && <p>Loading topics...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleCreateTopic} style={{ margin: '0 auto 1rem', maxWidth: '400px', width: '100%' }}>
        <input
          type="text"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          placeholder="Enter new topic name"
          style={{ marginRight: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.25rem 0.5rem' }}>Add Topic</button>
      </form>
      {!loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
          {topics.length > 0 ? (
            topics.map(topic => (
              <TopicCard
                key={topic.name}
                topic={topic}
                onDelete={handleDeleteTopic}
                onSelect={(topicName) => onNavigate('documents', topicName)}
              />
            ))
          ) : (
            <p>No topics found. Add one below!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicList;
