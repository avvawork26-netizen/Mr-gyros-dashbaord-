import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const TYPE_LABELS = {
  consultation: { label: 'Consultation' },
  showing:      { label: 'Showing' },
  follow_up:    { label: 'Follow-up' },
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function groupByDate(appts) {
  const groups = {};
  appts.forEach((a) => {
    if (!groups[a.date]) groups[a.date] = [];
    groups[a.date].push(a);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

const STATUS_STYLE = {
  scheduled:  { background: 'rgba(74,158,255,0.08)', color: '#4A9EFF',  border: '1px solid rgba(74,158,255,0.2)' },
  completed:  { background: 'transparent',            color: '#444444',  border: '1px solid #333333' },
  cancelled:  { background: 'transparent',            color: '#333333',  border: '1px solid #222222' },
};

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    api.getAppointments()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(apptId, newStatus) {
    try {
      const updated = await api.updateAppointment(apptId, { status: newStatus });
      setAppointments((prev) => prev.map((a) => a.id === apptId ? updated : a));
    } catch (err) { console.error(err); }
  }

  async function handleDelete(apptId) {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await api.deleteAppointment(apptId);
      setAppointments((prev) => prev.filter((a) => a.id !== apptId));
    } catch (err) { console.error(err); }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((a) => {
    if (filter === 'today')    return a.date === todayStr;
    if (filter === 'upcoming') return a.date >= todayStr && a.status === 'scheduled';
    return true;
  });

  const grouped = groupByDate(filtered);

  const FILTERS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'today',    label: 'Today' },
    { key: 'all',      label: 'All' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Appointments</h1>
          <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
            Mon–Fri · 9am–5pm EST
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-0 w-fit mb-5" style={{ border: '1px solid #222222' }}>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-5 h-5 border-2 animate-spin"
            style={{ borderColor: '#4A9EFF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card text-center py-16">
          <p className="font-medium text-white">No appointments found</p>
          <p className="text-xs mt-1" style={{ color: '#444444' }}>
            Ava will book appointments when leads are ready
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, appts]) => {
            const isToday = date === todayStr;
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2
                    className="text-xs font-semibold"
                    style={{ color: isToday ? '#4A9EFF' : '#444444', letterSpacing: '0.1em' }}
                  >
                    {isToday ? 'TODAY — ' : ''}{formatDate(date).toUpperCase()}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: '#1a1a1a' }} />
                  <span className="text-xs" style={{ color: '#333333' }}>
                    {appts.length} appt{appts.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="card">
                  {appts.map((appt, i) => {
                    const typeCfg = TYPE_LABELS[appt.type] || TYPE_LABELS.consultation;
                    const statusStyle = STATUS_STYLE[appt.status] || STATUS_STYLE.scheduled;
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center gap-4 px-5 py-4"
                        style={{ borderBottom: i < appts.length - 1 ? '1px solid #1a1a1a' : 'none' }}
                      >
                        {/* Time */}
                        <div className="w-16 shrink-0 text-right">
                          <p className="font-bold text-white text-sm leading-tight">
                            {formatTime(appt.time)}
                          </p>
                        </div>

                        <div className="w-px h-8 shrink-0" style={{ background: '#222222' }} />

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{appt.lead_name}</p>
                            <span
                              className="text-xs px-2 py-0.5 font-medium"
                              style={{ background: '#1c2d42', color: '#4A9EFF', border: '1px solid rgba(74,158,255,0.2)' }}
                            >
                              {typeCfg.label.toUpperCase()}
                            </span>
                          </div>
                          {appt.lead_phone && (
                            <p className="text-xs mt-0.5" style={{ color: '#444444' }}>
                              {appt.lead_phone}
                            </p>
                          )}
                          {appt.notes && (
                            <p className="text-xs mt-1 italic truncate" style={{ color: '#666666' }}>
                              {appt.notes}
                            </p>
                          )}
                        </div>

                        {/* Status + delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            className="text-xs font-medium px-2 py-1 cursor-pointer"
                            style={{ ...statusStyle, outline: 'none' }}
                          >
                            {['scheduled', 'completed', 'cancelled'].map((s) => (
                              <option key={s} value={s} style={{ background: '#161616', color: '#ffffff' }}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(appt.id)}
                            className="text-sm transition-colors"
                            style={{ color: '#333333' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#333333'; }}
                            title="Delete appointment"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
