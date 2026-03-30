/**
 * ChatWidget — Ava's embeddable chat interface.
 *
 * Can be used in two modes:
 *   1. Standalone: rendered directly on /chat page
 *   2. Embedded:   as a floating button/drawer on any website
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

// ── Chat UI ──────────────────────────────────────────────────────────────────
function ChatUI({ leadId: initialLeadId, onLeadCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [leadId, setLeadId] = useState(initialLeadId || null);
  const [lead, setLead] = useState(null);
  const [phase, setPhase] = useState(initialLeadId ? 'chatting' : 'intro'); // intro | form | chatting
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing conversation if leadId is provided
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
    // Send an opening message from Ava
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

    // Optimistically add user message
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
      <div className="flex flex-col h-full">
        {/* Hero */}
        <div className="bg-gradient-to-br from-navy-800 to-navy-950 text-white px-6 pt-8 pb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center text-2xl mx-auto mb-4">
            🏠
          </div>
          <h2 className="font-serif text-2xl font-bold mb-1">Hi, I'm Ava!</h2>
          <p className="text-navy-200 text-sm leading-relaxed">
            Your AI real estate guide for Orlando,<br />Clearwater, and the Florida Coast.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 py-6 bg-white">
          <p className="text-navy-800 font-semibold mb-4 text-center">Let's get started 👋</p>
          <form onSubmit={startChat} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Your name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Johnson"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone number (optional)</label>
              <input
                type="tel"
                placeholder="e.g. (407) 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors text-sm mt-2"
            >
              Start Chatting with Ava →
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-4">
            Powered by Ayoub Realty · Orlando & Florida Coast
          </p>
        </div>
      </div>
    );
  }

  // ── Chat screen ──
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-base shrink-0">
          🏠
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Ava</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-navy-200 text-xs">AI Real Estate Assistant · Ayoub Realty</p>
          </div>
        </div>
        {lead?.escalation_ready === 1 && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
            🚨 Escalated
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p className="text-sm">Say hello to get started!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">
                A
              </div>
            )}
            <div className="max-w-[80%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>
                {msg.text}
              </div>
              <p className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {formatTime(msg.time)}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              A
            </div>
            <div className="bubble-assistant flex items-center gap-1.5 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:bg-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Embedded widget (floating button) ───────────────────────────────────────
function EmbeddedWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[380px] h-[560px] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
          <ChatUI />
        </div>
      )}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-14 h-14 rounded-full bg-navy-800 hover:bg-navy-900 text-white shadow-xl flex items-center justify-center text-xl transition-all active:scale-95"
        title="Chat with Ava"
      >
        {open ? '✕' : '🏠'}
      </button>
    </div>
  );
}

// ── Exports ──────────────────────────────────────────────────────────────────
export { ChatUI, EmbeddedWidget };
export default ChatUI;
