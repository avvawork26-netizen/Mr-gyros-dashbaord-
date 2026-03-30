import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

// ── Utility helpers ──────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  hot:  { label: 'Hot',  dot: 'bg-red-500',    badge: 'badge-hot',  icon: '🔥' },
  warm: { label: 'Warm', dot: 'bg-amber-400',  badge: 'badge-warm', icon: '🌡️' },
  cold: { label: 'Cold', dot: 'bg-blue-400',   badge: 'badge-cold', icon: '❄️' },
};

const INTENT_LABELS = { buy: 'Buyer', sell: 'Seller', rent: 'Renter', invest: 'Investor', unknown: 'Unknown' };

function UrgencyBadge({ urgency }) {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.cold;
  return (
    <span className={cfg.badge}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'navy' }) {
  const colors = {
    navy:   'from-navy-800 to-navy-900',
    gold:   'from-gold-500 to-gold-600',
    red:    'from-red-500 to-red-600',
    emerald:'from-emerald-500 to-emerald-600',
  };
  return (
    <div className={`card p-5 bg-gradient-to-br ${colors[color]} text-white`}>
      <p className="text-sm opacity-80 font-medium">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

// ── Escalation Card ──────────────────────────────────────────────────────────
function EscalationCard({ lead, onViewConvo }) {
  return (
    <div className="card border-2 border-red-200 bg-red-50 p-5 escalation-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Escalation Ready
            </span>
          </div>
          <h3 className="font-semibold text-navy-900 text-lg">{lead.name}</h3>
          <p className="text-sm text-slate-500">
            {lead.phone || lead.email || 'No contact on file'}
          </p>
        </div>
        <button
          onClick={() => onViewConvo(lead.id)}
          className="btn-primary text-xs py-1.5 shrink-0"
        >
          View Conversation →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          ['Intent',   INTENT_LABELS[lead.intent] || lead.intent],
          ['Budget',   lead.budget    || '—'],
          ['Timeline', lead.timeline  || '—'],
          ['Area',     lead.area      || '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-white rounded-lg px-3 py-2">
            <p className="text-xs text-slate-400 font-medium">{k}</p>
            <p className="text-sm text-navy-800 font-semibold">{v}</p>
          </div>
        ))}
      </div>

      {lead.notes && (
        <div className="mt-3 bg-white rounded-lg px-3 py-2 text-sm text-slate-600 italic border-l-4 border-gold-400">
          {lead.notes}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
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

  const hotLeads        = leads.filter((l) => l.urgency === 'hot');
  const escalatedLeads  = leads.filter((l) => l.escalation_ready);
  const todayStr        = new Date().toISOString().split('T')[0];
  const todayAppts      = appointments.filter((a) => a.date === todayStr);
  const dueFollowups    = followups.filter((f) => new Date(f.scheduled_date) <= new Date());

  function handleViewConvo(leadId) {
    onSelectLead(leadId);
    navigate('/conversations');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Good morning, Ayoub 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}Orlando, FL
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">Ava is online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads"      value={leads.length}          sub="All time" color="navy" />
        <StatCard label="Hot Leads 🔥"     value={hotLeads.length}       sub="Need attention" color="red" />
        <StatCard label="Today's Appointments" value={todayAppts.length} sub="Scheduled" color="gold" />
        <StatCard label="Follow-ups Due"   value={dueFollowups.length}   sub="Pending send" color="emerald" />
      </div>

      {/* Escalation Alerts */}
      {escalatedLeads.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-navy-900">🚨 Escalation Queue</h2>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-navy-900">Recent Leads</h2>
            <button onClick={() => navigate('/leads')} className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View all →
            </button>
          </div>
          <div className="card divide-y divide-slate-100">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                onClick={() => handleViewConvo(lead.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 text-sm truncate">{lead.name}</p>
                  <p className="text-xs text-slate-400 truncate">{lead.area || lead.intent || 'New lead'}</p>
                </div>
                <UrgencyBadge urgency={lead.urgency} />
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">No leads yet. Run the seed script!</p>
            )}
          </div>
        </section>

        {/* Today's Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-navy-900">Today's Appointments</h2>
            <button onClick={() => navigate('/appointments')} className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              View all →
            </button>
          </div>
          <div className="card divide-y divide-slate-100">
            {todayAppts.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">No appointments today.</p>
            )}
            {todayAppts.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-12 text-center shrink-0">
                  <p className="text-lg font-bold text-navy-800 leading-none">
                    {appt.time.replace(':00', '')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {parseInt(appt.time) < 12 ? 'AM' : 'PM'}
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 text-sm truncate">{appt.lead_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{appt.type.replace('_', ' ')}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
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
            <h2 className="font-semibold text-navy-900">⏰ Follow-ups Due</h2>
            <button onClick={() => navigate('/followups')} className="text-sm text-gold-600 hover:text-gold-700 font-medium">
              Manage →
            </button>
          </div>
          <div className="card divide-y divide-slate-100">
            {dueFollowups.slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  f.lead_urgency === 'hot' ? 'bg-red-500' :
                  f.lead_urgency === 'warm' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-900 text-sm">{f.lead_name}</p>
                  <p className="text-xs text-slate-400">
                    Due {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{f.message_template} follow-up
                  </p>
                </div>
                <button
                  onClick={() => navigate('/followups')}
                  className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                >
                  Review →
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
