import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot',  icon: '🔥' },
  warm: { badge: 'badge-warm', icon: '🌡️' },
  cold: { badge: 'badge-cold', icon: '❄️' },
};

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// ── Lead selector sidebar ────────────────────────────────────────────────────
function LeadSidebar({ leads, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = leads.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-3 border-b border-slate-100">
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy-300"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-6">No leads found</p>
        )}
        {filtered.map((lead) => {
          const cfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                lead.id === selectedId ? 'bg-gold-50 border-l-2 border-l-gold-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-xs shrink-0">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{lead.name}</p>
                  <p className="text-xs text-slate-400">
                    {cfg.icon} {lead.urgency}
                    {lead.escalation_ready ? ' · 🚨 Escalated' : ''}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Conversation pane ────────────────────────────────────────────────────────
function ConversationPane({ lead, messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-2">💬</p>
          <p className="font-medium">Select a lead to view their conversation</p>
        </div>
      </div>
    );
  }

  const urgencyCfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Lead info bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold">
          {lead.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy-900">{lead.name}</p>
            <span className={urgencyCfg.badge}>{urgencyCfg.icon} {lead.urgency}</span>
            {lead.escalation_ready === 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                🚨 Escalation Ready
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {lead.phone || lead.email || 'No contact on file'}
            {lead.area ? ` · ${lead.area}` : ''}
          </p>
        </div>
        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
          {lead.budget && <span>💰 {lead.budget}</span>}
          {lead.timeline && <span>⏱ {lead.timeline}</span>}
          {lead.intent && lead.intent !== 'unknown' && (
            <span className="capitalize">🎯 {lead.intent}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <p>No messages yet.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">
                A
              </div>
            )}
            <div className="max-w-[70%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>
                {msg.message}
              </div>
              <p className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.role === 'user' ? lead.name : 'Ava'} · {formatTime(msg.created_at)}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-0.5">
                {lead.name.charAt(0)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Ava notes */}
      {lead.notes && (
        <div className="px-5 py-3 bg-gold-50 border-t border-gold-200">
          <p className="text-xs font-semibold text-gold-700 mb-1">📝 Ava's Notes for Ayoub</p>
          <p className="text-sm text-gold-900">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ConversationViewer({ leadId, onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Load all leads for the sidebar
  useEffect(() => {
    api.getLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoadingLeads(false));
  }, []);

  // When leadId prop changes (from Dashboard navigation), select that lead
  useEffect(() => {
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) selectLead(leadId);
    }
  }, [leadId, leads]);

  function selectLead(id) {
    onSelectLead(id);
    const lead = leads.find((l) => l.id === id);
    setSelectedLead(lead || null);
    setLoadingMsgs(true);
    api.getConversation(id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }

  return (
    <div className="flex h-full">
      {/* Leads sidebar */}
      {loadingLeads ? (
        <div className="w-64 flex items-center justify-center border-r border-slate-200">
          <div className="w-6 h-6 border-2 border-navy-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <LeadSidebar leads={leads} selectedId={leadId} onSelect={selectLead} />
      )}

      {/* Conversation pane */}
      {loadingMsgs ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-navy-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ConversationPane lead={selectedLead} messages={messages} />
      )}
    </div>
  );
}
