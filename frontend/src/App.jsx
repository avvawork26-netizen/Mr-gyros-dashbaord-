import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadList from './components/LeadList';
import AppointmentList from './components/AppointmentList';
import FollowUpQueue from './components/FollowUpQueue';
import ConversationViewer from './components/ConversationViewer';
import ChatPage from './components/ChatPage';

export default function App() {
  // selectedLeadId is shared state so Sidebar navigation can also open conversations
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public chat widget — no dashboard chrome */}
        <Route path="/chat" element={<ChatPage />} />

        {/* Dashboard shell with sidebar */}
        <Route
          path="/*"
          element={
            <div className="flex h-screen bg-slate-50 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Dashboard onSelectLead={setSelectedLeadId} />} />
                  <Route
                    path="/leads"
                    element={
                      <LeadList
                        selectedLeadId={selectedLeadId}
                        onSelectLead={setSelectedLeadId}
                      />
                    }
                  />
                  <Route path="/appointments" element={<AppointmentList />} />
                  <Route path="/followups" element={<FollowUpQueue />} />
                  <Route
                    path="/conversations"
                    element={
                      <ConversationViewer
                        leadId={selectedLeadId}
                        onSelectLead={setSelectedLeadId}
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
