import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../api';

const Settings = () => {
  const [settings, setSettings] = useState({ data_folder: '', gemini_api_key: '' });
  const [prompts, setPrompts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newPromptKey, setNewPromptKey] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [editingPromptKey, setEditingPromptKey] = useState(null);
  const [editingPromptContent, setEditingPromptContent] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings.');
      const data = await response.json();
      setSettings(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prompts`);
      if (!response.ok) throw new Error('Failed to fetch prompts.');
      const data = await response.json();
      setPrompts(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchPrompts();
  }, [fetchSettings, fetchPrompts]);

  

  const handleAddPrompt = async (e) => {
    e.preventDefault();
    if (!newPromptKey.trim() || !newPromptContent.trim()) {
      setError('Prompt key and content cannot be empty.');
      return;
    }
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newPromptKey, content: newPromptContent }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add prompt.');
      }
      setNewPromptKey('');
      setNewPromptContent('');
      await fetchPrompts();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEditPrompt = (key, content) => {
    setEditingPromptKey(key);
    setEditingPromptContent(content);
  };

  const handleUpdatePrompt = async (e) => {
    e.preventDefault();
    if (!editingPromptContent.trim()) {
      setError('Prompt content cannot be empty.');
      return;
    }
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/prompts/${editingPromptKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingPromptContent }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update prompt.');
      }
      setEditingPromptKey(null);
      setEditingPromptContent('');
      await fetchPrompts();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeletePrompt = async (key) => {
    if (!window.confirm(`Are you sure you want to delete the prompt "${key}"?`)) {
      return;
    }
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/prompts/${key}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete prompt.');
      }
      await fetchPrompts();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div style={{ padding: '0 0.5em' }}>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <h2 style={{ marginLeft: '0.5rem', marginTop: '0.3rem' }}>General Settings</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>Data Folder Path:</label>
        <input 
          type="text" 
          name="data_folder" 
          value={settings.data_folder}
          readOnly
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Gemini API Key:</label>
        <input 
          type="password" 
          name="gemini_api_key"
          value={settings.gemini_api_key}
          readOnly
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
      </div>

      <h2 style={{ marginLeft: '0.5rem', marginTop: '0.3rem' }}>Custom Prompts</h2>
      <div>
        <h3 style={{ marginLeft: '0.5rem' }}>Existing Prompts</h3>
        {Object.keys(prompts).length === 0 ? (
          <p>No custom prompts defined.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(prompts).map(([key, content]) => (
              <li key={key} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                {editingPromptKey === key ? (
                  <form onSubmit={handleUpdatePrompt}>
                    <label>Key: {key}</label>
                    <textarea 
                      value={editingPromptContent}
                      onChange={(e) => setEditingPromptContent(e.target.value)}
                      rows="5"
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    ></textarea>
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingPromptKey(null)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <div style={{ float: 'right' }}>
                      <button onClick={() => handleEditPrompt(key, content)} style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => handleDeletePrompt(key)} style={{ color: 'red' }}>Delete</button>
                    </div>
                    <strong>{key}:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{content}</pre>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleAddPrompt} style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginLeft: '0.5rem' }}>New Prompt</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label>Prompt Key:</label>
          <input 
            type="text" 
            value={newPromptKey}
            onChange={(e) => setNewPromptKey(e.target.value)}
            placeholder="e.g., summarize, chat_response"
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Prompt Content:</label>
          <textarea 
            value={newPromptContent}
            onChange={(e) => setNewPromptContent(e.target.value)}
            placeholder="e.g., Summarize the following: {context}"
            rows="5"
            style={{ width: '100%', marginTop: '0.5rem' }}
          ></textarea>
        </div>
        <button type="submit">Add Prompt</button>
      </form>
    </div>
  );
};

export default Settings;
