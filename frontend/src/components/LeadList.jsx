import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { label: 'Hot',  badge: 'badge-hot' },
  warm: { label: 'Warm', badge: 'badge-warm' },
  cold: { label: 'Cold', badge: 'badge-cold' },
};

const INTENT_MAP = {
  buy:     { label: 'Buyer',    cls: 'badge-buy' },
  sell:    { label: 'Seller',   cls: 'badge-sell' },
  rent:    { label: 'Renter',   cls: 'badge-rent' },
  invest:  { label: 'Investor', cls: 'badge-invest' },
  unknown: { label: '—',        cls: 'badge-unknown' },
};

const STATUS_STYLES = {
  new:       { background: 'transparent', color: '#666666', border: '1px solid #333333' },
  active:    { background: 'rgba(74,158,255,0.08)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.2)' },
  escalated: { background: 'rgba(74,158,255,0.15)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.35)' },
  closed:    { background: 'transparent', color: '#333333', border: '1px solid #222222' },
};

export default function LeadList({ selectedLeadId, onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter === 'escalated') params.escalation_ready = 'true';
    else if (filter !== 'all') params.urgency = filter;
    api.getLeads(params)
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filteredLeads = leads.filter((l) =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search) ||
    (l.area || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatusChange(lead, newStatus) {
    try {
      const updated = await api.updateLead(lead.id, { status: newStatus });
      setLeads((prev) => prev.map((l) => l.id === lead.id ? updated : l));
    } catch (err) { console.error(err); }
  }

  function handleViewConvo(leadId) {
    onSelectLead(leadId);
    navigate('/conversations');
  }

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'hot',       label: 'Hot' },
    { key: 'warm',      label: 'Warm' },
    { key: 'cold',      label: 'Cold' },
    { key: 'escalated', label: 'Escalated' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Leads</h1>
          <p className="text-xs mt-0.5" style={{ color: '#444444' }}>{leads.length} total</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div
          className="flex gap-0"
          style={{ border: '1px solid #222222', background: '#111111' }}
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === key ? '#4A9EFF' : 'transparent',
                color: filter === key ? '#000000' : '#666666',
                borderRight: '1px solid #222222',
                letterSpacing: '0.05em',
              }}
            >
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name, email, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-medium text-white">No leads found</p>
              <p className="text-xs mt-1" style={{ color: '#444444' }}>
                Try adjusting the filters or search
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ background: '#111111', borderBottom: '1px solid #222222' }}>
                <tr>
                  {['Lead', 'Intent', 'Budget', 'Area', 'Timeline', 'Urgency', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 label">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => {
                  const urgencyCfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
                  const intentCfg  = INTENT_MAP[lead.intent] || INTENT_MAP.unknown;
                  const isSelected = lead.id === selectedLeadId;
                  return (
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: i < filteredLeads.length - 1 ? '1px solid #1a1a1a' : 'none',
                        background: isSelected ? 'rgba(74,158,255,0.05)' : 'transparent',
                        borderLeft: isSelected ? '2px solid #4A9EFF' : '2px solid transparent',
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {lead.escalation_ready === 1 && (
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                              style={{ background: '#4A9EFF' }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{lead.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
                              {lead.phone || lead.email || 'No contact'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={intentCfg.cls}>{intentCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#888888' }}>
                        {lead.budget || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[140px] truncate" style={{ color: '#888888' }}>
                        {lead.area || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#888888' }}>
                        {lead.timeline || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={urgencyCfg.badge}>{urgencyCfg.label.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value)}
                          className="text-xs font-medium px-2 py-1 cursor-pointer"
                          style={{
                            ...(STATUS_STYLES[lead.status] || STATUS_STYLES.active),
                            background: (STATUS_STYLES[lead.status] || STATUS_STYLES.active).background,
                            outline: 'none',
                          }}
                        >
                          {['new', 'active', 'escalated', 'closed'].map((s) => (
                            <option key={s} value={s} style={{ background: '#161616', color: '#ffffff' }}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewConvo(lead.id)}
                          className="btn-ghost text-xs py-1 px-2"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
