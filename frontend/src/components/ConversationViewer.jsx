import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot' },
  warm: { badge: 'badge-warm' },
  cold: { badge: 'badge-cold' },
};

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function LeadSidebar({ leads, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = leads.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col"
      style={{ borderRight: '1px solid #222222', background: '#111111' }}
    >
      <div className="p-3" style={{ borderBottom: '1px solid #222222' }}>
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input text-xs py-1.5"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: '#444444' }}>No leads found</p>
        )}
        {filtered.map((lead) => {
          const cfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
          const isSelected = lead.id === selectedId;
          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead.id)}
              className="w-full text-left px-3 py-3 transition-colors"
              style={{
                borderBottom: '1px solid #1a1a1a',
                borderLeft: isSelected ? '2px solid #4A9EFF' : '2px solid transparent',
                background: isSelected ? 'rgba(74,158,255,0.06)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = '#161616';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#1c2d42', color: '#4A9EFF' }}
                >
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
                    {lead.urgency}
                    {lead.escalation_ready ? ' · Escalated' : ''}
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

function ConversationPane({ lead, messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!lead) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: '#0a0a0a' }}
      >
        <div className="text-center">
          <p className="font-medium text-white">Select a lead</p>
          <p className="text-xs mt-1" style={{ color: '#444444' }}>
            Choose a lead from the left to view conversation
          </p>
        </div>
      </div>
    );
  }

  const urgencyCfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Lead info bar */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ background: '#111111', borderBottom: '1px solid #222222' }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: '#1c2d42', color: '#4A9EFF' }}
        >
          {lead.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white">{lead.name}</p>
            <span className={urgencyCfg.badge}>{lead.urgency.toUpperCase()}</span>
            {lead.escalation_ready === 1 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.25)' }}
              >
                Escalation Ready
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
            {lead.phone || lead.email || 'No contact'}
            {lead.area ? ` · ${lead.area}` : ''}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs" style={{ color: '#666666' }}>
          {lead.budget   && <span>{lead.budget}</span>}
          {lead.timeline && <span>{lead.timeline}</span>}
          {lead.intent && lead.intent !== 'unknown' && (
            <span className="capitalize">{lead.intent}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        style={{ background: '#0a0a0a' }}
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: '#444444' }}>No messages yet.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
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
            <div className="max-w-[70%]">
              <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'}>
                {msg.message}
              </div>
              <p
                className={`text-xs mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}
                style={{ color: '#444444' }}
              >
                {msg.role === 'user' ? lead.name : 'Ava'} · {formatTime(msg.created_at)}
              </p>
            </div>
            {msg.role === 'user' && (
              <div
                className="w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mb-0.5"
                style={{ background: '#222222', color: '#888888' }}
              >
                {lead.name.charAt(0)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Ava notes */}
      {lead.notes && (
        <div
          className="px-5 py-3"
          style={{ borderTop: '1px solid #222222', borderLeft: '2px solid #4A9EFF', background: '#111111' }}
        >
          <p className="label mb-1">Ava's Notes for Ayoub</p>
          <p className="text-sm" style={{ color: '#888888' }}>{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function ConversationViewer({ leadId, onSelectLead }) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    api.getLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoadingLeads(false));
  }, []);

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
      {loadingLeads ? (
        <div
          className="w-60 flex items-center justify-center"
          style={{ borderRight: '1px solid #222222' }}
        >
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <LeadSidebar leads={leads} selectedId={leadId} onSelect={selectLead} />
      )}

      {loadingMsgs ? (
        <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <ConversationPane lead={selectedLead} messages={messages} />
      )}
    </div>
  );
}
