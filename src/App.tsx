import { useState } from 'react';
import { ChatProvider } from './store/ChatContext';
import { ChatInterface } from './components/ChatInterface';
import { MessageSquare } from 'lucide-react';
import './index.css';

function App() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ 
      width: '100%', 
      height: '100dvh', 
      backgroundColor: '#f1f5f9', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Container that acts as a mobile frame on desktop and full-screen on mobile */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        maxWidth: '480px', 
        backgroundColor: '#fff', 
        position: 'relative', 
        overflow: 'hidden',
      }} className="main-wrapper">
        {isOpen ? (
          <ChatProvider>
            <ChatInterface />
          </ChatProvider>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC" width="120" style={{ marginBottom: '2rem' }} />
            <h1>Dashboard</h1>
            <p style={{ color: '#6c757d' }}>Simulated HDFC NetBanking</p>
            
            <button 
              onClick={() => setIsOpen(true)}
              style={{
                position: 'absolute',
                bottom: '2rem',
                right: '2rem',
                backgroundColor: 'var(--color-accent)',
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
      
      <style>{`
        @media (min-width: 481px) {
          .main-wrapper {
            max-height: 900px;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
