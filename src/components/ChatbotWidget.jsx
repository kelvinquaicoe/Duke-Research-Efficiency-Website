import React, { useState } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00c7ff 0%, #0096b4 100%)',
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 199, 255, 0.4)',
        }}
        title="Chat with Slurm-O"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Chatbot Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '400px',
            height: '600px',
            maxHeight: '80vh',
            background: '#050810',
            borderRadius: '12px',
            border: '2px solid rgba(0, 199, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 199, 255, 0.2)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 199, 255, 0.1) 0%, rgba(0, 150, 180, 0.05) 100%)',
              borderBottom: '1px solid rgba(0, 199, 255, 0.2)',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: '"Orbitron", sans-serif',
                color: '#e2e8f8',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Slurm<span style={{ color: '#00c7ff' }}>-O</span> AI
            </h3>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => e.target.style.color = '#ff4b4b'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
            >
              ✕
            </button>
          </div>

          {/* Chatbot Iframe */}
          <iframe
            src="http://localhost:5000/"
            style={{
              flex: 1,
              border: 'none',
              borderRadius: '0',
            }}
            title="Slurm-O Chatbot"
          />

          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Overlay when modal is open */}
      {isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
        />
      )}
    </>
  );
}
