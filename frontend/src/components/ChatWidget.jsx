/**
 * ChatWidget — Ava's embeddable chat interface.
 *
 * Props:
 *   embedded {boolean} — if true, renders as a floating widget with toggle button
 *   initialLeadId {number} — resume a conversation with an existing lead
 */
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

function formatTime(dt) {
  return new Date(dt || Date.now()).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function DiamondIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11,2 18,11 11,20 4,11" fill="none" stroke="#4A9EFF" strokeWidth="1.5" />
      <polygon points="11,6 16,11 11,16 6,11" fill="#4A9EFF" opacity="0.3" />
    </svg>
  );
}

function ChatUI({ leadId: initialLeadId, onLeadCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(initialLeadId || null);
  const [lead, setLead] = useState(null);
  const [phase, setPhase] = useState(initialLeadId ? 'chatting' : 'intro');
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialLeadId) {
      Promise.all([
        api.getLead(initialLeadId),
        api.getConversation(initialLeadId),
      ]).then(([lead, msgs]) => {
        setLead(lead);
        setMessages(msgs.map((m) => ({ role: m.role, text: m.message, time: m.created_at })));
      }).catch(console.error);
    }
  }, [initialLeadId]);

  async function startChat(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setPhase('chatting');
    setSending(true);
    try {
      const res = await api.chat({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        message: `Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.`,
      });
      setLeadId(res.leadId);
      setLead(res.lead);
      if (onLeadCreated) onLeadCreated(res.leadId);
      setMessages([
        { role: 'user', text: `Hi! My name is ${formData.name.trim()} and I'm interested in Florida real estate.`, time: new Date().toISOString() },
        { role: 'assistant', text: res.response, time: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setSending(true);

    const userEntry = { role: 'user', text: userMsg, time: new Date().toISOString() };
    setMessages((prev) => [...prev, userEntry]);

    try {
      const res = await api.chat({ leadId, message: userMsg });
      setLead(res.lead);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.response, time: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "I'm sorry, I ran into a technical issue. Please try again in a moment!", time: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ── Intro screen ──
  if (phase === 'intro') {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>
        {/* Hero */}
        <div
          className="px-6 pt-8 pb-10 text-center"
          style={{ background: '#111111', borderBottom: '1px solid #222222' }}
        >
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ border: '1px solid #222222', background: '#161616' }}
          >
            <DiamondIcon size={28} />
          </div>
          <h2
            className="text-xl font-bold text-white tracking-widest mb-1"
            style={{ letterSpacing: '0.2em' }}
          >
            AVA
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: '#666666', letterSpacing: '0.05em' }}>
            AI Real Estate Guide · Orlando, Clearwater &amp; Florida Coast
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 py-6" style={{ background: '#0a0a0a' }}>
          <p className="label text-center mb-5">Get started</p>
          <form onSubmit={startChat} className="space-y-3">
            <div>
              <label className="label block mb-1">Your name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Johnson"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label block mb-1">Phone number (optional)</label>
              <input
                type="tel"
                placeholder="e.g. (407) 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                className="input"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2"
              style={{ letterSpacing: '0.08em' }}
            >
              START CHAT
            </button>
          </form>
          <p className="text-center text-xs mt-4" style={{ color: '#333333' }}>
            Powered by Ayoub Realty · Orlando &amp; Florida Coast
          </p>
        </div>
      </div>
    );
  }

  // ── Chat screen ──
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: '#111111', borderBottom: '1px solid #222222' }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ background: '#161616', border: '1px solid #222222' }}
        >
          <DiamondIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-white text-sm tracking-widest"
            style={{ letterSpacing: '0.15em' }}
          >
            AVA
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#4A9EFF' }}
            />
            <p className="text-xs" style={{ color: '#4A9EFF' }}>Online · Ayoub Realty</p>
          </div>
        </div>
        {lead?.escalation_ready === 1 && (
          <span
            className="text-xs px-2 py-0.5 font-medium"
            style={{ background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.25)' }}
          >
            Escalated
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: '#0a0a0a' }}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: '#444444' }}>Say hello to get started.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mb-0.5"
                style={{ background: '#1c2d42', color: '#4A9EFF' }}
              >
                A
              </div>
            )}
            <div className="max-w-[80%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>
                {msg.text}
              </div>
              <p
                className={`text-xs mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}
                style={{ color: '#444444' }}
              >
                {formatTime(msg.time)}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: '#1c2d42', color: '#4A9EFF' }}
            >
              A
            </div>
            <div className="bubble-assistant flex items-center gap-1.5 py-3">
              <span
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: '#444444', animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: '#444444', animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: '#444444', animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-3 flex gap-2"
        style={{ background: '#111111', borderTop: '1px solid #222222' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="input flex-1"
          style={{ opacity: sending ? 0.6 : 1 }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary px-4 py-2 text-sm"
          style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function EmbeddedWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          className="mb-4 w-[380px] h-[560px] overflow-hidden flex flex-col"
          style={{ border: '1px solid #222222', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}
        >
          <ChatUI />
        </div>
      )}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-14 h-14 text-white flex items-center justify-center transition-all active:scale-95"
        style={{
          background: '#161616',
          border: '1px solid #4A9EFF',
          boxShadow: '0 0 20px rgba(74,158,255,0.2)',
        }}
        title="Chat with Ava"
      >
        {open ? '✕' : <DiamondIcon size={20} />}
      </button>
    </div>
  );
}

export { ChatUI, EmbeddedWidget };
export default ChatUI;
