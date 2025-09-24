import React, { useState } from 'react';
import Header from './Header';

/**
 * A basic layout component that includes a side menu and a main content area.
 * @param {object} props - The properties for the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered in the main content area.
 * @param {function} props.onNavigate - Function to handle navigation clicks.
 * @param {boolean} props.isSidebarOpen - Whether the sidebar is currently open.
 * @param {function} props.toggleSidebar - Function to toggle the sidebar's visibility.
 * @param {object} props.headerProps - Props to pass to the Header component (title, onBack, backButtonText).
 * @param {string} props.currentViewName - The name of the currently active view.
 * @returns {React.ReactElement} The layout component.
 */
const Layout = ({ children, onNavigate, isSidebarOpen, toggleSidebar, headerProps, currentViewName }) => {
  const [isButtonHovered, setButtonHovered] = useState(false);
  const contentPadding = currentViewName === 'settings' ? '0' : '0.5rem';

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      <aside
        style={{
          width: isSidebarOpen ? '152px' : '0px',
          borderRight: isSidebarOpen ? '1px solid #ccc' : 'none',
          padding: isSidebarOpen ? '1rem' : '0',
          height: '100vh',
          overflow: 'hidden',
          transition: 'width 0.3s ease-in-out, padding 0.3s ease-in-out',
          flexShrink: 0,
          background: '#f8f8f8',
        }}
      >
        <h2>PDFMan</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('topics'); }}>
                Topics
              </a>
            </li>
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('settings'); }}>
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <button
        onClick={toggleSidebar}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        style={{
          position: 'absolute',
          top: '0.8rem',
          left: isSidebarOpen ? '140px' : (isButtonHovered ? '0' : '-12px'),
          background: 'gray',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          outline: 'none',
          width: '23px',
          height: '23px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '0.5rem',
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out, background-color 0.2s'
        }}
      >
        {isSidebarOpen ? '<' : '>'}
      </button>

      <main style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header {...headerProps} />
        <div id="main-content-area" style={{
          padding: 0,
          flexGrow: 1,
          width: isSidebarOpen ? 'calc(100vw - 152px)' : '100vw',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;