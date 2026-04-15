import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',              label: 'Dashboard' },
  { to: '/leads',         label: 'Leads' },
  { to: '/conversations', label: 'Conversations' },
  { to: '/appointments',  label: 'Appointments' },
  { to: '/followups',     label: 'Follow-ups' },
];

export default function Sidebar() {
  return (
    <aside className="w-52 flex-shrink-0 flex flex-col" style={{ background: '#0d0d0d', borderRight: '1px solid #1e1e1e' }}>
      {/* Logo */}
      <div className="px-5 pt-7 pb-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ fontSize: 17, fontWeight: 300, letterSpacing: '0.3em', color: '#ffffff', textTransform: 'uppercase' }}>
          Ava
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 400, letterSpacing: '0.12em', color: '#404040', textTransform: 'uppercase', marginTop: 4 }}>
          AI Realtor Assistant
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              letterSpacing: '0.03em',
              color: isActive ? '#f0f0f0' : '#484848',
              background: isActive ? '#141414' : 'transparent',
              borderLeft: isActive ? '2px solid #4A9EFF' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.15s, background 0.15s',
            })}
            onMouseEnter={(e) => { if (!e.currentTarget.dataset.active) e.currentTarget.style.color = '#888888'; }}
            onMouseLeave={(e) => { /* handled by NavLink style fn */ }}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-5" style={{ borderTop: '1px solid #1e1e1e', paddingTop: 14 }}>
        <a
          href="/chat"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '7px 0', fontSize: 10, fontWeight: 400,
            letterSpacing: '0.1em', color: '#585858', textTransform: 'uppercase',
            textDecoration: 'none', border: '1px solid #242424', background: 'transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.borderColor = '#333333'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#585858'; e.currentTarget.style.borderColor = '#242424'; }}
        >
          Open Chat Widget
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4A9EFF', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#404040', letterSpacing: '0.04em' }}>Ava online</span>
        </div>
      </div>
    </aside>
  );
}
