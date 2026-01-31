# smart-home

Apps for Sweet Smart Home

> Django-based smart home dashboard with real-time device monitoring via WebSocket.

## Tech Stack

- **Backend:** Django 5.2, Django Channels, Daphne (ASGI)
- **Real-time:** WebSocket via Redis (Channel Layer)
- **Frontend:** Vanilla JS, CSS3 Custom Properties, Lucide SVG Icons
- **Infrastructure:** Docker Compose (web + redis containers)
- **Typography:** Plus Jakarta Sans (Google Fonts)

## Features

### Dashboard
- Room-based device grouping with sidebar navigation
- Toggle devices on/off with animated switch
- Live stats bar — total devices, active count, rooms, connection status
- Room filtering from sidebar
- Skeleton loading states

### Real-time
- WebSocket auto-reconnect with exponential backoff
- Live device status updates pushed from server
- Connection status badge (connected/reconnecting)
- Simulate random device updates via API

### UI/UX
- Dark/Light theme toggle (persisted to localStorage)
- Dark theme: Forest Green palette (#2B3E34, #546A50, #7E8A6D)
- Light theme: Warm Orange accent
- Glassmorphism on header & sidebar (backdrop-filter blur)
- Ambient floating orbs background animation
- Stagger fade-in, ripple effects, pulse glow on active devices
- Dynamic greeting (Morning/Afternoon/Evening) with username
- Live clock display
- Fully responsive — mobile drawer sidebar at 768px breakpoint

### Security
- Login required for dashboard access
- CSRF protection on all POST endpoints
- POST-based logout with confirmation dialog
- `@never_cache` prevents back-button access after logout
- Environment-based SECRET_KEY, DEBUG, ALLOWED_HOSTS

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard (login required) |
| GET | `/login/` | Login page |
| POST | `/logout/` | Logout (POST only) |
| GET | `/api/devices/` | List all devices (JSON) |
| POST | `/api/devices/<id>/toggle/` | Toggle device status |
| GET | `/simulate/` | Push random device update via WebSocket |

## Models

- **Room** — `name` (unique)
- **Device** — `name`, `type` (light/fan/ac/pump/sensor), `status` (bool), `room` (FK)

## Project Structure

```
smart-home/
├── app/
│   ├── core/              # Settings, ASGI, root URLs
│   ├── dashboard/
│   │   ├── static/        # CSS, JS (style.css, dashboard.js, theme.js)
│   │   ├── templates/     # dashboard.html, login.html
│   │   ├── models.py      # Room, Device
│   │   ├── views.py       # Dashboard, API, WebSocket simulate
│   │   ├── consumers.py   # WebSocket consumer
│   │   └── routing.py     # WebSocket URL routing
│   ├── Dockerfile
│   └── manage.py
├── scripts/               # PowerShell: start, stop, restart, remove, shell
├── docker-compose.yml
├── quickstart.md
└── .gitignore
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | fallback key | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1,0.0.0.0` | Allowed hosts |

## Quick Start

```powershell
.\scripts\start.ps1
```

Dashboard: `http://localhost:8000` · Admin: `http://localhost:8000/admin`

> See [quickstart.md](quickstart.md) for detailed setup guide.
