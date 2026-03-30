/**
 * API client — thin wrapper around fetch() for all backend calls.
 * The Vite dev proxy routes /api → http://localhost:3001.
 */
const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Leads
  getLeads:   (params = {}) => request('GET', `/leads?${new URLSearchParams(params)}`),
  getLead:    (id)          => request('GET', `/leads/${id}`),
  createLead: (body)        => request('POST', '/leads', body),
  updateLead: (id, body)    => request('PATCH', `/leads/${id}`, body),
  deleteLead: (id)          => request('DELETE', `/leads/${id}`),

  // Conversations
  getConversation: (leadId) => request('GET', `/conversations/${leadId}`),

  // Appointments
  getAppointments: (params = {}) => request('GET', `/appointments?${new URLSearchParams(params)}`),
  getSlots:        (date)        => request('GET', `/appointments/slots/${date}`),
  bookAppointment: (body)        => request('POST', '/appointments', body),
  updateAppointment: (id, body)  => request('PATCH', `/appointments/${id}`, body),
  deleteAppointment: (id)        => request('DELETE', `/appointments/${id}`),

  // Follow-ups
  getFollowUps:    (params = {}) => request('GET', `/followups?${new URLSearchParams(params)}`),
  updateFollowUp:  (id, body)    => request('PATCH', `/followups/${id}`, body),
  processFollowUps: ()           => request('POST', '/followups/process', {}),

  // Chat
  chat: (body) => request('POST', '/chat', body),

  // Health
  health: () => request('GET', '/health'),
};
