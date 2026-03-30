/**
 * ChatPage — the full-page chat interface available at /chat
 * This is what leads see when they click a link or are directed to chat with Ava.
 * It's also a preview of the embeddable widget.
 */
import React from 'react';
import ChatWidget from './ChatWidget';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 flex items-center justify-center p-4">
      {/* Chat window */}
      <div className="w-full max-w-md h-[700px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-navy-700">
        <ChatWidget />
      </div>

      {/* Attribution */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-navy-400 text-xs">
          Powered by <span className="text-gold-400 font-medium">Ava AI</span> · Ayoub Realty · Orlando & Florida Coast
        </p>
      </div>
    </div>
  );
}
