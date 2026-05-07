import { useState } from 'react';
import { ChatProvider } from './store/ChatContext';
import { ChatInterface } from './components/ChatInterface';
import { MessageSquare } from 'lucide-react';
import './index.css';

function App() {
  const [isOpen, setIsOpen] = useState(true);

  // In a real app, this might be a floating button that opens a modal
  // or a dedicated tab. For the prototype, we show the full chat interface.

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Simulation of a mobile device frame container */}
      <div style={{ width: '100%', height: '100%', maxWidth: '480px', maxHeight: '900px', backgroundColor: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {isOpen ? (
          <ChatProvider>
            <ChatInterface />
          </ChatProvider>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC NetBanking" width="120" style={{ marginBottom: '2rem' }} />
            <h1>Dashboard</h1>
            <p style={{ color: '#6c757d' }}>Simulated HDFC NetBanking Dashboard</p>
            
            <button 
              onClick={() => setIsOpen(true)}
              style={{
                position: 'absolute',
                bottom: '2rem',
                right: '2rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <MessageSquare size={32} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
