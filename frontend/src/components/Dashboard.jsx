import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const INTENT_LABELS = { buy: 'Buyer', sell: 'Seller', rent: 'Renter', invest: 'Investor', unknown: 'Unknown' };

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#444444' }}>{sub}</p>}
    </div>
  );
}

function EscalationCard({ lead, onViewConvo }) {
  return (
    <div
      className="card p-5 esc-pulse"
      style={{ borderColor: 'rgba(74,158,255,0.3)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#4A9EFF' }}
            />
            <span className="label">Escalation Ready</span>
          </div>
          <h3 className="font-semibold text-white text-base mt-1">{lead.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
            {lead.phone || lead.email || 'No contact on file'}
          </p>
        </div>
        <button
          onClick={() => onViewConvo(lead.id)}
          className="btn-dim text-xs py-1.5 shrink-0 whitespace-nowrap"
        >
          View Conversation
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {[
          ['Intent',   INTENT_LABELS[lead.intent] || lead.intent || '—'],
          ['Budget',   lead.budget   || '—'],
          ['Timeline', lead.timeline || '—'],
          ['Area',     lead.area     || '—'],
        ].map(([k, v]) => (
          <div key={k} className="px-3 py-2" style={{ background: '#0a0a0a', border: '1px solid #222222' }}>
            <p className="label text-xs">{k}</p>
            <p className="text-sm text-white font-medium mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      {lead.notes && (
        <div
          className="mt-3 px-3 py-2 text-xs italic"
          style={{ background: '#0a0a0a', borderLeft: '2px solid #4A9EFF', color: '#888888' }}
        >
          {lead.notes}
        </div>
      )}
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
    Promise.all([
      api.getLeads(),
      api.getAppointments({ status: 'scheduled' }),
      api.getFollowUps({ status: 'pending' }),
    ])
      .then(([l, a, f]) => {
        setLeads(l);
        setAppointments(a);
        setFollowups(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hotLeads       = leads.filter((l) => l.urgency === 'hot');
  const escalatedLeads = leads.filter((l) => l.escalation_ready);
  const todayStr       = new Date().toISOString().split('T')[0];
  const todayAppts     = appointments.filter((a) => a.date === todayStr);
  const dueFollowups   = followups.filter((f) => new Date(f.scheduled_date) <= new Date());

  function handleViewConvo(leadId) {
    onSelectLead(leadId);
    navigate('/conversations');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-5 h-5 border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}Orlando, FL
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{ border: '1px solid #222222', background: '#161616' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#4A9EFF' }}
          />
          <span className="text-xs font-medium" style={{ color: '#4A9EFF', letterSpacing: '0.08em' }}>
            AVA ONLINE
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Leads"      value={leads.length}         sub="All time" />
        <StatCard label="Hot Leads"        value={hotLeads.length}      sub="Need attention" />
        <StatCard label="Today"            value={todayAppts.length}    sub="Appointments" />
        <StatCard label="Follow-ups Due"   value={dueFollowups.length}  sub="Pending send" />
      </div>

      {/* Escalation Alerts */}
      {escalatedLeads.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="label">Escalation Queue</h2>
            <span
              className="px-2 py-0.5 text-xs font-bold"
              style={{ background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.25)' }}
            >
              {escalatedLeads.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {escalatedLeads.map((lead) => (
              <EscalationCard key={lead.id} lead={lead} onViewConvo={handleViewConvo} />
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Leads */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="label">Recent Leads</h2>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs font-medium transition-colors"
              style={{ color: '#4A9EFF' }}
            >
              View all
            </button>
          </div>
          <div className="card" style={{ borderColor: '#222222' }}>
            {leads.slice(0, 5).map((lead, i) => (
              <div
                key={lead.id}
                onClick={() => handleViewConvo(lead.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < Math.min(leads.length, 5) - 1 ? '1px solid #1a1a1a' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#1c2d42', color: '#4A9EFF' }}
                >
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                  <p className="text-xs truncate" style={{ color: '#444444' }}>
                    {lead.area || lead.intent || 'New lead'}
                  </p>
                </div>
                <span className={`badge-${lead.urgency || 'cold'}`}>
                  {(lead.urgency || 'cold').toUpperCase()}
                </span>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-center py-8 text-xs" style={{ color: '#444444' }}>
                No leads yet. Run the seed script.
              </p>
            )}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="label">Today's Appointments</h2>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-medium"
              style={{ color: '#4A9EFF' }}
            >
              View all
            </button>
          </div>
          <div className="card">
            {todayAppts.length === 0 && (
              <p className="text-center py-8 text-xs" style={{ color: '#444444' }}>
                No appointments today.
              </p>
            )}
            {todayAppts.map((appt, i) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < todayAppts.length - 1 ? '1px solid #1a1a1a' : 'none' }}
              >
                <div className="w-14 shrink-0">
                  <p className="text-base font-bold text-white leading-none">
                    {appt.time.replace(':00', '')}
                  </p>
                  <p className="text-xs" style={{ color: '#444444' }}>
                    {parseInt(appt.time) < 12 ? 'AM' : 'PM'}
                  </p>
                </div>
                <div className="w-px h-8 shrink-0" style={{ background: '#222222' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{appt.lead_name}</p>
                  <p className="text-xs capitalize" style={{ color: '#444444' }}>
                    {appt.type.replace('_', ' ')}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 font-medium"
                  style={{ background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.2)' }}
                >
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Follow-up queue preview */}
      {dueFollowups.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="label">Follow-ups Due</h2>
            <button
              onClick={() => navigate('/followups')}
              className="text-xs font-medium"
              style={{ color: '#4A9EFF' }}
            >
              Manage
            </button>
          </div>
          <div className="card">
            {dueFollowups.slice(0, 3).map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < Math.min(dueFollowups.length, 3) - 1 ? '1px solid #1a1a1a' : 'none' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      f.lead_urgency === 'hot'  ? '#4A9EFF' :
                      f.lead_urgency === 'warm' ? '#888888' : '#333333',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{f.lead_name}</p>
                  <p className="text-xs" style={{ color: '#444444' }}>
                    Due {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{f.message_template} follow-up
                  </p>
                </div>
                <button
                  onClick={() => navigate('/followups')}
                  className="text-xs font-medium"
                  style={{ color: '#4A9EFF' }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
