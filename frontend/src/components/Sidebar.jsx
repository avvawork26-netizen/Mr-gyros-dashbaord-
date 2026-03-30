import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',              icon: '⊞', label: 'Dashboard' },
  { to: '/leads',         icon: '👥', label: 'Leads' },
  { to: '/conversations', icon: '💬', label: 'Conversations' },
  { to: '/appointments',  icon: '📅', label: 'Appointments' },
  { to: '/followups',     icon: '🔔', label: 'Follow-ups' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-navy-900 text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-navy-700">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center text-lg">
            🏠
          </div>
          <div>
            <div className="font-serif text-lg font-semibold leading-tight text-white">Ava</div>
            <div className="text-xs text-navy-300 leading-tight">AI Realtor Assistant</div>
          </div>
        </div>
        <div className="mt-3 px-2 py-1.5 bg-navy-800 rounded-lg">
          <p className="text-xs text-navy-300">
            <span className="text-gold-400 font-medium">Ayoub</span> · Orlando & Florida Coast
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
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
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-navy-600 text-navy-300 hover:bg-navy-800 hover:text-white text-sm font-medium transition-colors"
        >
          <span>🤖</span> Open Chat Widget
        </a>
        <p className="text-center text-xs text-navy-500 mt-2">Preview Ava's chat interface</p>
      </div>
    </aside>
  );
}
