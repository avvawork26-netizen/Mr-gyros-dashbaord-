import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',              label: 'Dashboard' },
  { to: '/leads',         label: 'Leads' },
  { to: '/conversations', label: 'Conversations' },
  { to: '/appointments',  label: 'Appointments' },
  { to: '/followups',     label: 'Follow-ups' },
];

function DiamondIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11,2 18,11 11,20 4,11" fill="none" stroke="#4A9EFF" strokeWidth="1.5" />
      <polygon points="11,6 16,11 11,16 6,11" fill="#4A9EFF" opacity="0.25" />
      <polygon points="11,6 16,11 11,16 6,11" fill="none" stroke="#4A9EFF" strokeWidth="1" />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col"
      style={{ background: '#111111', borderRight: '1px solid #222222' }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-6" style={{ borderBottom: '1px solid #222222' }}>
        <div className="flex items-center gap-2.5">
          <DiamondIcon />
          <div>
            <div
              className="text-white font-bold tracking-[0.2em] text-base leading-none"
              style={{ letterSpacing: '0.25em' }}
            >
              AVA
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#444444', letterSpacing: '0.08em' }}>
              AI REALTOR
            </div>
          </div>
        </div>
        <div
          className="mt-4 px-3 py-2 text-xs"
          style={{ background: '#161616', border: '1px solid #222222', color: '#666666' }}
        >
          <span style={{ color: '#4A9EFF' }}>AYOUB</span>
          {' · '}Orlando &amp; Florida Coast
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-l-2 text-white'
                  : 'border-l-2 border-transparent hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              borderLeftColor: isActive ? '#4A9EFF' : 'transparent',
              color: isActive ? '#ffffff' : '#666666',
              background: isActive ? 'rgba(74,158,255,0.06)' : 'transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Chat widget link */}
      <div className="px-4 pb-6">
        <a
          href="/chat"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-full py-2 text-xs font-medium transition-colors"
          style={{
            border: '1px solid #222222',
            color: '#666666',
            letterSpacing: '0.08em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#444444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#222222';
            e.currentTarget.style.color = '#666666';
          }}
        >
          OPEN CHAT WIDGET
        </a>
      </div>
    </aside>
  );
}
