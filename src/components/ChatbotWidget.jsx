import React, { useState, useEffect } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  // Ensure widget is mounted on client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowConfirmClose(false);
  };

  const handleCloseClick = () => {
    // Show confirmation popup
    setShowConfirmClose(true);
  };

  const confirmClose = () => {
    setIsOpen(false);
    setShowConfirmClose(false);
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  // Handle resize from bottom-right corner
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(300, startWidth + deltaX);
      const newHeight = Math.max(400, startHeight + deltaY);
      setWidth(newWidth);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Floating Chatbot Button - Sticky */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00c7ff 0%, #0096b4 100%)',
          border: '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 199, 255, 0.4)',
          position: 'fixed',
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
            width: `${width}px`,
            height: `${height}px`,
            background: '#050810',
            borderRadius: '12px',
            border: '2px solid rgba(0, 199, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 199, 255, 0.2)',
            zIndex: 51,
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
              onClick={handleCloseClick}
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

          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '20px',
              height: '20px',
              position: 'absolute',
              bottom: '0',
              right: '0',
              cursor: 'nwse-resize',
              background: 'linear-gradient(135deg, transparent 0%, rgba(0, 199, 255, 0.3) 100%)',
              borderRadius: '0 0 10px 0',
            }}
            title="Drag to resize"
          />
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmClose && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 52,
          }}
          onClick={cancelClose}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1830',
              border: '2px solid rgba(0, 199, 255, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 199, 255, 0.2)',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#e2e8f8', fontSize: '16px' }}>
              Close Chatbot?
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Are you sure you want to close?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={confirmClose}
                style={{
                  padding: '8px 20px',
                  background: '#ff4b4b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Close
              </button>
              <button
                onClick={cancelClose}
                style={{
                  padding: '8px 20px',
                  background: 'rgba(0, 199, 255, 0.2)',
                  color: '#00c7ff',
                  border: '1px solid rgba(0, 199, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
