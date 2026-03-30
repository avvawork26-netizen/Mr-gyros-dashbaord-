import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const TYPE_LABELS = {
  consultation: { label: 'Consultation', icon: '🤝', color: 'bg-blue-100 text-blue-700' },
  showing:      { label: 'Showing',      icon: '🏠', color: 'bg-emerald-100 text-emerald-700' },
  follow_up:    { label: 'Follow-up',    icon: '📞', color: 'bg-purple-100 text-purple-700' },
};

const STATUS_COLORS = {
  scheduled:  'bg-emerald-100 text-emerald-700',
  completed:  'bg-slate-100 text-slate-500',
  cancelled:  'bg-red-100 text-red-600',
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

// Group appointments by date
function groupByDate(appts) {
  const groups = {};
  appts.forEach((a) => {
    if (!groups[a.date]) groups[a.date] = [];
    groups[a.date].push(a);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // upcoming | all | today

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ayoub's schedule · Mon–Fri, 9am–5pm EST
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit mb-5">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'today',    label: 'Today' },
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
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-navy-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-2">📅</p>
          <p className="font-medium">No appointments found</p>
          <p className="text-sm mt-1">Ava will book appointments when leads are ready</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, appts]) => {
            const isToday = date === todayStr;
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className={`font-semibold text-sm ${isToday ? 'text-gold-600' : 'text-slate-500'}`}>
                    {isToday ? '📍 Today — ' : ''}{formatDate(date)}
                  </h2>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">{appts.length} appt{appts.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="card divide-y divide-slate-100">
                  {appts.map((appt) => {
                    const typeCfg = TYPE_LABELS[appt.type] || TYPE_LABELS.consultation;
                    return (
                      <div key={appt.id} className="flex items-center gap-4 px-5 py-4">
                        {/* Time */}
                        <div className="w-16 shrink-0 text-right">
                          <p className="font-bold text-navy-800 text-base leading-tight">
                            {formatTime(appt.time)}
                          </p>
                        </div>

                        <div className="w-px h-10 bg-slate-200 shrink-0" />

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-navy-900">{appt.lead_name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCfg.color}`}>
                              {typeCfg.icon} {typeCfg.label}
                            </span>
                          </div>
                          {appt.lead_phone && (
                            <p className="text-xs text-slate-400 mt-0.5">{appt.lead_phone}</p>
                          )}
                          {appt.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic truncate">{appt.notes}</p>
                          )}
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[appt.status]}`}
                          >
                            {['scheduled', 'completed', 'cancelled'].map((s) => (
                              <option key={s} value={s} className="bg-white text-slate-800">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDelete(appt.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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
