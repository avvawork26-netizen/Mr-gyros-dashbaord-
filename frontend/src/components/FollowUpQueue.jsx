import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const STATUS_STYLE = {
  pending:   { background: 'rgba(74,158,255,0.08)', color: '#4A9EFF',  border: '1px solid rgba(74,158,255,0.2)' },
  sent:      { background: 'transparent',            color: '#444444',  border: '1px solid #333333' },
  cancelled: { background: 'transparent',            color: '#333333',  border: '1px solid #222222' },
};

const URGENCY_CONFIG = {
  hot:  { badge: 'badge-hot' },
  warm: { badge: 'badge-warm' },
  cold: { badge: 'badge-cold' },
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

  const FILTERS = [
    { key: 'pending',   label: 'Pending' },
    { key: 'sent',      label: 'Sent' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all',       label: 'All' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Follow-up Queue</h1>
          <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
            Day 1, 3, and 7 follow-ups are scheduled automatically per lead
          </p>
        </div>
        <button
          onClick={handleProcessNow}
          disabled={processing}
          className="btn-dim flex items-center gap-2"
          style={{ opacity: processing ? 0.6 : 1 }}
        >
          {processing ? (
            <>
              <div
                className="w-3.5 h-3.5 border-2 animate-spin"
                style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
              />
              Processing...
            </>
          ) : (
            'Process Due Now'
          )}
        </button>
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <div
          className="mb-4 px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(74,158,255,0.05)',
            border: '1px solid rgba(74,158,255,0.2)',
            borderLeft: '3px solid #4A9EFF',
          }}
        >
          <p className="text-sm font-medium" style={{ color: '#4A9EFF' }}>
            {overdueCount} follow-up{overdueCount !== 1 ? 's' : ''} overdue
          </p>
          <p className="text-xs" style={{ color: '#666666' }}>
            Click "Process Due Now" to send via Ava
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-0 w-fit mb-5" style={{ border: '1px solid #222222' }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 text-xs font-medium transition-colors relative"
            style={{
              background: filter === key ? '#4A9EFF' : 'transparent',
              color: filter === key ? '#000000' : '#666666',
              borderRight: '1px solid #222222',
              letterSpacing: '0.05em',
            }}
          >
            {label.toUpperCase()}
            {key === 'pending' && pendingCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 text-xs leading-none font-bold"
                style={{
                  background: filter === key ? 'rgba(0,0,0,0.2)' : '#4A9EFF',
                  color: filter === key ? '#000' : '#000',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : followups.length === 0 ? (
        <div className="card text-center py-16">
          <p className="font-medium text-white">No follow-ups in this category</p>
          <p className="text-xs mt-1" style={{ color: '#444444' }}>
            New leads automatically get Day 1, 3, and 7 follow-ups
          </p>
        </div>
      ) : (
        <div className="card">
          {followups.map((f, i) => {
            const urgencyCfg = URGENCY_CONFIG[f.lead_urgency] || URGENCY_CONFIG.cold;
            const statusStyle = STATUS_STYLE[f.status] || STATUS_STYLE.pending;
            const dateInfo    = formatScheduledDate(f.scheduled_date);

            return (
              <div
                key={f.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{
                  borderBottom: i < followups.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Urgency indicator */}
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      f.lead_urgency === 'hot'  ? '#4A9EFF' :
                      f.lead_urgency === 'warm' ? '#888888' : '#333333',
                  }}
                />

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white">{f.lead_name}</p>
                    <span className={urgencyCfg.badge}>{f.lead_urgency.toUpperCase()}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
                    {TEMPLATE_LABELS[f.message_template] || f.message_template}
                  </p>
                  {f.lead_phone && (
                    <p className="text-xs" style={{ color: '#333333' }}>{f.lead_phone}</p>
                  )}
                </div>

                {/* Due date */}
                <div className="shrink-0 text-right">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: dateInfo.overdue ? '#4A9EFF' : '#666666' }}
                  >
                    {dateInfo.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#333333' }}>
                    {new Date(f.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-medium px-2 py-1"
                    style={statusStyle}
                  >
                    {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                  </span>
                  {f.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(f.id, 'sent')}
                        className="px-2 py-1 text-xs font-medium transition-colors"
                        style={{ background: 'rgba(74,158,255,0.1)', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.2)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,158,255,0.1)'; }}
                      >
                        Mark Sent
                      </button>
                      <button
                        onClick={() => handleStatusChange(f.id, 'cancelled')}
                        className="px-2 py-1 text-xs font-medium transition-colors"
                        style={{ background: 'transparent', color: '#444444', border: '1px solid #222222' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#444444'; }}
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
