
import React, { useState, useEffect } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({ data_folder: '', gemini_api_key: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings.');
        const data = await response.json();
        setSettings(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings.');
      alert('Settings saved successfully!');
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div>
      <h2>Settings</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Data Folder Path:</label>
          <input 
            type="text" 
            name="data_folder" 
            value={settings.data_folder}
            onChange={handleChange}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Gemini API Key:</label>
          <input 
            type="password" 
            name="gemini_api_key"
            value={settings.gemini_api_key}
            onChange={handleChange}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </div>
        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
};

export default Settings;
