# Ava — AI Real Estate Assistant

**Ava** is a full-stack AI-powered real estate assistant for **Ayoub**, a licensed realtor based in Orlando, Florida, also serving Clearwater and the Florida Gulf Coast.

Built with React + Tailwind CSS (frontend), Node.js/Express (backend), SQLite (database), and Anthropic Claude (AI).

---

## Features

- **AI Lead Chat** — Ava converses with leads, qualifies them, and books appointments
- **Lead Dashboard** — Full lead management with Hot/Warm/Cold urgency scoring
- **Conversation Viewer** — See every message Ava exchanged with each lead
- **Appointments** — Ava books slots in Ayoub's calendar (Mon–Fri, 9am–5pm EST)
- **Follow-up Queue** — Automatic Day 1/3/7 follow-ups for quiet leads
- **Escalation Alerts** — Dashboard cards for leads ready to hand off to Ayoub
- **Embeddable Chat Widget** — Self-contained widget for any website

---

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- An Anthropic API key — get one at https://console.anthropic.com

### 2. Clone & Install

```bash
git clone <repo-url>
cd Mr-gyros-dashbaord-

# Install all dependencies (root + backend + frontend)
npm run install:all
```

### 3. Configure Environment

```bash
# Create the backend .env file
cp .env.example backend/.env

# Edit backend/.env and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Seed the Database

Populates 5 sample leads (Maria, Jennifer, James, David, Amanda) in various stages:

```bash
npm run seed
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend** on http://localhost:3001
- **Frontend** on http://localhost:5173

### 6. Open the App

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Ayoub's dashboard |
| http://localhost:5173/chat | Ava's lead chat interface |
| http://localhost:3001/api/health | API health check |

---

## Project Structure

```
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── database/
│   │   ├── db.js                  # SQLite schema & connection
│   │   └── seed.js                # Sample data seeder
│   ├── routes/
│   │   ├── chat.js                # Core AI chat endpoint
│   │   ├── leads.js               # Lead CRUD
│   │   ├── conversations.js       # Conversation history
│   │   ├── appointments.js        # Appointment booking
│   │   └── followups.js           # Follow-up queue
│   └── services/
│       ├── ava.js                 # Claude AI integration
│       └── followupScheduler.js   # Cron-based follow-up sender
│
├── frontend/
│   └── src/
│       ├── App.jsx                # Router & layout
│       ├── api/client.js          # Fetch wrapper for all API calls
│       └── components/
│           ├── Dashboard.jsx      # Main dashboard view
│           ├── Sidebar.jsx        # Navigation sidebar
│           ├── LeadList.jsx       # Lead management table
│           ├── ConversationViewer.jsx  # Chat history viewer
│           ├── AppointmentList.jsx     # Appointment calendar
│           ├── FollowUpQueue.jsx       # Follow-up management
│           ├── ChatWidget.jsx          # Embeddable chat UI
│           └── ChatPage.jsx            # Standalone chat page
│
├── package.json        # Root scripts (dev, seed, etc.)
└── .env.example        # Environment variable template
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send a message to Ava |
| `GET` | `/api/leads` | List leads (supports `?urgency=hot&status=active`) |
| `GET` | `/api/leads/:id` | Get single lead |
| `PATCH` | `/api/leads/:id` | Update lead fields |
| `GET` | `/api/conversations/:leadId` | Get conversation history |
| `GET` | `/api/appointments` | List appointments |
| `GET` | `/api/appointments/slots/:date` | Available slots for date |
| `POST` | `/api/appointments` | Book appointment |
| `GET` | `/api/followups` | List follow-ups |
| `PATCH` | `/api/followups/:id` | Update follow-up status |
| `POST` | `/api/followups/process` | Manually process due follow-ups |
| `GET` | `/api/health` | Health check |

### Chat API Example

```bash
# New lead (first message)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"name": "Sarah Johnson", "phone": "407-555-0100", "message": "Hi! Looking to buy a condo in Clearwater."}'

# Existing lead (follow-up message)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"leadId": 1, "message": "My budget is around $350k and I want 2 bedrooms."}'
```

---

## Embedding the Chat Widget

Add the chat widget to any HTML page:

```html
<!-- In your website's HTML -->
<div id="ava-widget"></div>
<script type="module">
  // Point this to your deployed backend URL
  const BACKEND_URL = 'https://your-backend.com';

  // Or simply link to the /chat page in an iframe
</script>
```

Or link directly to the standalone chat page:
```html
<a href="https://your-domain.com/chat">Chat with Ava</a>
```

---

## Seed Data

The seed script creates 5 realistic leads:

| Lead | Status | Urgency | Summary |
|------|--------|---------|---------|
| **Maria Santos** | Escalated | 🔥 Hot | Pre-approved buyer, $320-380k, Clearwater Beach condo, 60-day timeline |
| **Jennifer Chen** | Escalated | 🔥 Hot | NYC relocation, $700k, Lake Nona 4BR + pool, family of 4 |
| **James Wilson** | Active | 🌡️ Warm | Sell Lake Nona + buy Tampa, $450-550k, summer timeline |
| **Amanda Taylor** | Active | 🌡️ Warm | Renter, $2,500-3,500/mo, Clearwater Beach, 30-day timeline |
| **David Martinez** | Active | ❄️ Cold | Investor, $250-400k, Gulf Coast Airbnb, 6-12 month timeline |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | **Required** |
| `PORT` | Backend server port | `3001` |

---

## Design System

- **Colors**: Deep navy (`#0f2342`) + gold (`#c9a227`) + white
- **Typography**: Inter (UI) + Playfair Display (headings)
- **Components**: Tailwind CSS utility classes with custom component layer

---

## Security Notes

- The Anthropic API key is **only used server-side** — never exposed to the browser
- All AI calls go through the Express backend
- SQLite database is stored locally in `backend/data/ava.db`

---

## Development Tips

```bash
# Re-seed the database (clears existing data)
npm run seed

# Run backend only
cd backend && npm run dev

# Run frontend only
cd frontend && npm run dev

# Check API health
curl http://localhost:3001/api/health
```
