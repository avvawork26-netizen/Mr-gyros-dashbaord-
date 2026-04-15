import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const INTENT_LABELS = { buy: 'Buyer', sell: 'Seller', rent: 'Renter', invest: 'Investor', unknown: '—' };

const S = {
  muted:   { color: '#404040' },
  sub:     { color: '#363636', fontSize: 10 },
  name:    { color: '#d8d8d8', fontWeight: 500 },
  accent:  { color: '#4A9EFF' },
  border:  { borderBottom: '1px solid #161616' },
};

function StatCard({ label, value, sub, accentValue }) {
  return (
    <div className="card p-5">
      <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', color: '#404040', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 300, color: accentValue ? '#4A9EFF' : '#f2f2f2', lineHeight: 1.15, marginTop: 6 }}>{value}</p>
      {sub && <p style={S.sub}>{sub}</p>}
    </div>
  );
}

function EscalationCard({ lead, onViewConvo }) {
  return (
    <div className="card p-5 esc-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4A9EFF' }} />
            <span className="label">Escalation Ready</span>
          </div>
          <p style={{ ...S.name, fontSize: 14, marginTop: 2 }}>{lead.name}</p>
          <p style={{ ...S.muted, fontSize: 11, marginTop: 2 }}>{lead.phone || lead.email || 'No contact'}</p>
        </div>
        <button onClick={() => onViewConvo(lead.id)} className="btn-dim shrink-0" style={{ fontSize: 10 }}>View Conversation</button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {[['Intent', INTENT_LABELS[lead.intent] || '—'], ['Budget', lead.budget || '—'], ['Timeline', lead.timeline || '—'], ['Area', lead.area || '—']].map(([k, v]) => (
          <div key={k} className="px-3 py-2" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
            <p className="label">{k}</p>
            <p style={{ color: '#c8c8c8', fontSize: 12, fontWeight: 500, marginTop: 3 }}>{v}</p>
          </div>
        ))}
      </div>
      {lead.notes && <div className="mt-3 px-3 py-2" style={{ borderLeft: '2px solid #4A9EFF', background: '#0a0a0a' }}><p style={{ color: '#484848', fontSize: 11, fontStyle: 'italic' }}>{lead.notes}</p></div>}
    </div>
  );
}

export default function Dashboard({ onSelectLead }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getLeads(), api.getAppointments({ status: 'scheduled' }), api.getFollowUps({ status: 'pending' })])
      .then(([l, a, f]) => { setLeads(l); setAppointments(a); setFollowups(f); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const hotLeads = leads.filter(l => l.urgency === 'hot');
  const escalated = leads.filter(l => l.escalation_ready);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const dueFollowups = followups.filter(f => new Date(f.scheduled_date) <= new Date());

  function handleViewConvo(id) { onSelectLead(id); navigate('/conversations'); }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-4 h-4 border border-t-transparent animate-spin" style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 19, fontWeight: 400, color: '#f2f2f2' }}>Good morning, Ayoub</h1>
        <p style={{ fontSize: 11, color: '#404040', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Orlando, FL
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Leads"    value={leads.length}       sub="All time" />
        <StatCard label="Hot Leads"      value={hotLeads.length}    sub="Need attention" accentValue />
        <StatCard label="Today"          value={todayAppts.length}  sub="Appointments" />
        <StatCard label="Follow-ups Due" value={dueFollowups.length} sub="Pending send" />
      </div>

      {/* Escalation */}
      {escalated.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span className="label">Escalation Queue</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', background: '#0c1d33', color: '#4A9EFF', border: '1px solid #172d4d' }}>{escalated.length}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {escalated.map(l => <EscalationCard key={l.id} lead={l} onViewConvo={handleViewConvo} />)}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Leads */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="label">Recent Leads</span>
            <button onClick={() => navigate('/leads')} style={{ fontSize: 11, color: '#4A9EFF', background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
          </div>
          <div className="card">
            {leads.length === 0 && <p className="text-center py-8" style={{ fontSize: 11, color: '#303030' }}>No leads yet.</p>}
            {leads.slice(0, 5).map((lead, i) => (
              <div key={lead.id} onClick={() => handleViewConvo(lead.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                style={{ borderBottom: i < Math.min(leads.length, 5) - 1 ? '1px solid #161616' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-7 h-7 flex items-center justify-center text-xs shrink-0" style={{ background: '#191919', border: '1px solid #252525', color: '#585858', fontWeight: 500 }}>
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#d8d8d8' }} className="truncate">{lead.name}</p>
                  <p style={{ fontSize: 11, color: '#404040' }} className="truncate">{lead.area || lead.intent || 'New lead'}</p>
                </div>
                <span className={`badge-${lead.urgency || 'cold'}`}>{(lead.urgency || 'cold').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="label">Today's Appointments</span>
            <button onClick={() => navigate('/appointments')} style={{ fontSize: 11, color: '#4A9EFF', background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
          </div>
          <div className="card">
            {todayAppts.length === 0 && <p className="text-center py-8" style={{ fontSize: 11, color: '#303030' }}>No appointments today.</p>}
            {todayAppts.map((appt, i) => (
              <div key={appt.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < todayAppts.length - 1 ? '1px solid #161616' : 'none' }}>
                <div style={{ width: 48, flexShrink: 0 }}>
                  <p style={{ fontSize: 10, color: '#4A9EFF', fontWeight: 500 }}>{appt.time.replace(':00', '')} {parseInt(appt.time) < 12 ? 'AM' : 'PM'}</p>
                </div>
                <div className="w-px h-6 shrink-0" style={{ background: '#1e1e1e' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#d8d8d8' }} className="truncate">{appt.lead_name}</p>
                  <p style={{ fontSize: 11, color: '#404040', textTransform: 'capitalize' }}>{appt.type.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Follow-ups preview */}
      {dueFollowups.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="label">Follow-ups Due</span>
            <button onClick={() => navigate('/followups')} style={{ fontSize: 11, color: '#4A9EFF', background: 'none', border: 'none', cursor: 'pointer' }}>Manage</button>
          </div>
          <div className="card">
            {dueFollowups.slice(0, 3).map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < Math.min(dueFollowups.length, 3) - 1 ? '1px solid #161616' : 'none' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.lead_urgency === 'hot' ? '#4A9EFF' : f.lead_urgency === 'warm' ? '#484848' : '#2a2a2a' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#d8d8d8' }}>{f.lead_name}</p>
                  <p style={{ fontSize: 11, color: '#404040' }}>Due {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {f.message_template}</p>
                </div>
                <button onClick={() => navigate('/followups')} style={{ fontSize: 11, color: '#4A9EFF', background: 'none', border: 'none', cursor: 'pointer' }}>Review</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
