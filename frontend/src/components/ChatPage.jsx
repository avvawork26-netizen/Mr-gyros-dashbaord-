/**
 * ChatPage — full-page chat interface at /chat
 * This is what leads see when directed to chat with Ava.
 */
import React from 'react';
import ChatWidget from './ChatWidget';

export default function ChatPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0a0a0a' }}
    >
      {/* Chat window */}
      <div
        className="w-full max-w-md overflow-hidden flex flex-col"
        style={{
          height: '700px',
          border: '1px solid #222222',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        <ChatWidget />
      </div>

      {/* Attribution */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs" style={{ color: '#333333', letterSpacing: '0.08em' }}>
          Powered by <span style={{ color: '#4A9EFF' }}>Ava AI</span> · Ayoub Realty · Orlando &amp; Florida Coast
        </p>
      </div>
    </div>
  );
}
