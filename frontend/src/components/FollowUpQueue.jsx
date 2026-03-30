import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  sent:      { label: 'Sent',      color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500' },
};

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot',  icon: '🔥' },
  warm: { badge: 'badge-warm', icon: '🌡️' },
  cold: { badge: 'badge-cold', icon: '❄️' },
};

const TEMPLATE_LABELS = {
  day1: 'Day 1 — Gentle Check-in',
  day3: 'Day 3 — Value Nudge',
  day7: 'Day 7 — Final Re-engagement',
};

function formatScheduledDate(dt) {
  const d = new Date(dt);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return { label: overdueDays === 0 ? 'Due today' : `${overdueDays}d overdue`, overdue: true };
  }
  if (diffDays === 0) return { label: 'Due today', overdue: false };
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `Due in ${diffDays} days`, overdue: false };
}

export default function FollowUpQueue() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('pending');

  function fetchFollowUps() {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    api.getFollowUps(params)
      .then(setFollowups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchFollowUps(); }, [filter]);

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateFollowUp(id, { status });
      setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, ...updated } : f));
    } catch (err) { console.error(err); }
  }

  async function handleProcessNow() {
    setProcessing(true);
    try {
      await api.processFollowUps();
      fetchFollowUps();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }

  const pendingCount = followups.filter((f) => f.status === 'pending').length;
  const overdueCount = followups.filter((f) => {
    return f.status === 'pending' && new Date(f.scheduled_date) <= new Date();
  }).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Follow-up Queue</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ava automatically schedules Day 1, 3, and 7 follow-ups for each new lead
          </p>
        </div>
        <button
          onClick={handleProcessNow}
          disabled={processing}
          className="btn-gold flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>⚡ Process Due Now</>
          )}
        </button>
      </div>

      {/* Stats banner */}
      {overdueCount > 0 && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <span className="text-amber-600 text-lg">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">
            {overdueCount} follow-up{overdueCount !== 1 ? 's' : ''} overdue — click "Process Due Now" to send via Ava
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit mb-5">
        {[
          { key: 'pending',  label: 'Pending' },
          { key: 'sent',     label: 'Sent' },
          { key: 'cancelled',label: 'Cancelled' },
          { key: 'all',      label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === key ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
            {key === 'pending' && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-navy-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : followups.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-2">🔔</p>
          <p className="font-medium">No follow-ups in this category</p>
          <p className="text-sm mt-1">New leads automatically get Day 1, 3, and 7 follow-ups</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {followups.map((f) => {
            const urgencyCfg = URGENCY_CONFIG[f.lead_urgency] || URGENCY_CONFIG.cold;
            const statusCfg  = STATUS_CONFIG[f.status];
            const dateInfo   = formatScheduledDate(f.scheduled_date);

            return (
              <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                {/* Urgency dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  f.lead_urgency === 'hot' ? 'bg-red-500' :
                  f.lead_urgency === 'warm' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-navy-900">{f.lead_name}</p>
                    <span className={urgencyCfg.badge}>{urgencyCfg.icon} {f.lead_urgency}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {TEMPLATE_LABELS[f.message_template] || f.message_template}
                  </p>
                  {f.lead_phone && (
                    <p className="text-xs text-slate-400">{f.lead_phone}</p>
                  )}
                </div>

                {/* Due date */}
                <div className="shrink-0 text-right">
                  <p className={`text-xs font-semibold ${dateInfo.overdue ? 'text-red-600' : 'text-slate-500'}`}>
                    {dateInfo.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  {f.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(f.id, 'sent')}
                        className="px-2 py-1 text-xs rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium transition-colors"
                      >
                        Mark Sent
                      </button>
                      <button
                        onClick={() => handleStatusChange(f.id, 'cancelled')}
                        className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
