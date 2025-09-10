import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import DocumentList from './pages/DocumentList';
import Settings from './pages/Settings';
import TopicList from './pages/TopicList'; // Import TopicList
import './App.css';

/**
 * The main application component that manages view state.
 * @returns {React.ReactElement} The App component.
 */
function App() {
  const [currentView, setCurrentView] = useState({ name: 'topics' }); // { name: 'topics' } | { name: 'documents', topicName: '' } | { name: 'settings' }
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [documentTitle, setDocumentTitle] = useState('');

  const handleSetDocumentTitle = useCallback((title) => {
    setDocumentTitle(title);
  }, []);

  const handleNavigate = useCallback((viewName, topicName = null) => {
    setCurrentView({ name: viewName, topicName });
    if (viewName === 'topics') {
      setDocumentTitle(''); // Reset documentTitle when navigating to topics
    }
  }, [setCurrentView, setDocumentTitle]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  let content;
  let headerProps = {};

  switch (currentView.name) {
    case 'topics':
      content = <TopicList onNavigate={handleNavigate} />;
      headerProps = { title: 'Topic List' };
      break;
    case 'documents':
      content = (
        <DocumentList 
          topicName={currentView.topicName} 
          onBackToTopics={() => handleNavigate('topics')} 
          onSetDocumentTitle={handleSetDocumentTitle} // Pass the callback
        />
      );
      headerProps = { title: documentTitle || currentView.topicName };
      break;
    case 'settings':
      content = <Settings />;
      headerProps = { title: 'Settings' };
      break;
    default:
      content = <p>Page not found.</p>;
      headerProps = { title: 'Error' };
  }

  return (
    <Layout id='layout' onNavigate={handleNavigate} isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} headerProps={headerProps} currentViewName={currentView.name}>
      {content}
    </Layout>
  );
}

export default App;