import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const URGENCY_CONFIG = {
  hot:  { label: 'Hot',  badge: 'badge-hot',  icon: '🔥' },
  warm: { label: 'Warm', badge: 'badge-warm', icon: '🌡️' },
  cold: { label: 'Cold', badge: 'badge-cold', icon: '❄️' },
};

const INTENT_MAP = {
  buy: { label: 'Buyer',    cls: 'badge-buy' },
  sell:{ label: 'Seller',   cls: 'badge-sell' },
  rent:{ label: 'Renter',   cls: 'badge-rent' },
  invest:{ label: 'Investor', cls: 'badge-invest' },
  unknown:{ label: '—',    cls: 'badge-unknown' },
};

const STATUS_COLORS = {
  new:       'bg-slate-100 text-slate-600',
  active:    'bg-blue-100 text-blue-700',
  escalated: 'bg-red-100 text-red-700',
  closed:    'bg-slate-200 text-slate-500',
};

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export default function LeadList({ selectedLeadId, onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | hot | warm | cold | escalated
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // lead being edited inline

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
    { key: 'all',       label: 'All Leads' },
    { key: 'hot',       label: '🔥 Hot' },
    { key: 'warm',      label: '🌡️ Warm' },
    { key: 'cold',      label: '❄️ Cold' },
    { key: 'escalated', label: '🚨 Escalated' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-0.5">{leads.length} total leads</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name, email, area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
        />
      </div>

      {/* Leads table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-navy-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">👥</p>
              <p className="font-medium">No leads found</p>
              <p className="text-sm mt-1">Try adjusting the filters or search</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Lead', 'Intent', 'Budget', 'Area', 'Timeline', 'Urgency', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const urgencyCfg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.cold;
                  const intentCfg  = INTENT_MAP[lead.intent] || INTENT_MAP.unknown;
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50 transition-colors ${lead.id === selectedLeadId ? 'bg-gold-50' : ''}`}
                    >
                      {/* Lead name + contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {lead.escalation_ready === 1 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Escalation ready" />
                          )}
                          <div>
                            <p className="font-semibold text-navy-900">{lead.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {lead.phone || lead.email || 'No contact'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Intent */}
                      <td className="px-4 py-3">
                        <span className={intentCfg.cls}>{intentCfg.label}</span>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3 text-slate-600">{lead.budget || '—'}</td>

                      {/* Area */}
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{lead.area || '—'}</td>

                      {/* Timeline */}
                      <td className="px-4 py-3 text-slate-600">{lead.timeline || '—'}</td>

                      {/* Urgency */}
                      <td className="px-4 py-3">
                        <span className={urgencyCfg.badge}>
                          {urgencyCfg.icon} {urgencyCfg.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[lead.status] || STATUS_COLORS.active}`}
                        >
                          {['new', 'active', 'escalated', 'closed'].map((s) => (
                            <option key={s} value={s} className="bg-white text-slate-800">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewConvo(lead.id)}
                            className="px-2 py-1 text-xs rounded bg-navy-100 hover:bg-navy-200 text-navy-700 font-medium transition-colors"
                          >
                            Chat
                          </button>
                        </div>
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
