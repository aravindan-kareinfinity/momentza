import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadRuntimeConfig } from './config/runtimeConfig';
import './index.css'

// Error boundary component for startup errors
const StartupErrorBoundary = ({ error }: { error: Error }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: '500px',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>??</div>
        <h1 style={{
          color: '#dc3545',
          marginBottom: '15px',
          fontSize: '24px'
        }}>Application Startup Error</h1>
        <p style={{
          color: '#6c757d',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          The application failed to start properly. This might be due to a server connection issue.
        </p>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          textAlign: 'left',
          fontSize: '14px',
          color: '#495057'
        }}>
          <strong>Error:</strong> {error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

async function startApp() {
  try {
    // Load runtime configuration with timeout handling
    console.log('Starting application...');
    await loadRuntimeConfig();
    console.log('Runtime configuration loaded successfully');
    
    // Create root and render app
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to start application:', error);
    
    // Render error boundary instead of crashing
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <StartupErrorBoundary error={error as Error} />
    );
  }
}

// Start the application
startApp();
