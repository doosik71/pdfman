import React from 'react';

/**
 * A basic layout component that includes a side menu and a main content area.
 * @param {object} props - The properties for the component.
 * @param {React.ReactNode} props.children - The child elements to be rendered in the main content area.
 * @param {function} props.onNavigate - Function to handle navigation clicks.
 * @returns {React.ReactElement} The layout component.
 */
const Layout = ({ children, onNavigate }) => {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem', height: '100vh' }}>
        <h2>PDFMan</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '1rem' }}>
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
      <main style={{ flex: 1, padding: '1rem', overflowY: 'auto', height: '100vh' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;