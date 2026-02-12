# Smart Home Dashboard

Django-based smart home dashboard with real-time monitoring for **Home Automation**, **Solar PV**, **Hydroponics**, and **Fishery** systems.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.2, Django Channels, Daphne (ASGI) |
| Database | PostgreSQL 16 + TimescaleDB (time-series) |
| Real-time | WebSocket via Redis Channel Layer |
| Visualization | Grafana (4 dashboards) |
| Frontend | Vanilla JS, CSS3, Lucide Icons |
| Infrastructure | Docker Compose |

## Features

### Multi-System Support
- 🏠 **Home** — Smart lights, AC, cameras, sensors, switches, valves
- ☀️ **Solar PV** — Panel monitoring, battery bank, inverter, grid import/export
- 🥬 **Hydroponics** — NFT systems, pH/EC/TDS sensors, nutrient pumps, grow lights
- 🐟 **Fishery** — Gurame ponds, DO/pH/ammonia monitoring, aerators, auto feeders

### Core Features
- **Dashboard** — Category-based navigation, room grouping, toggle controls
- **Real-time** — WebSocket auto-reconnect, live device updates
- **Historical Data** — TimescaleDB hypertable with compression & retention
- **Visualization** — 4 Grafana dashboards (Home, Solar PV, Hydro, Fishery)
- **Threshold Alerts** — Critical value indicators (min/max)
- **UI/UX** — Dark/Light theme, glassmorphism, responsive mobile drawer

---

## Quick Start

```bash
# 1. Clone & masuk direktori
git clone <repo-url> smart-home
cd smart-home

# 2. Build & start
docker compose up --build -d

# 3. Buat admin account
docker compose exec -it web python manage.py createsuperuser

# 4. (Optional) Generate sample data untuk Grafana
docker compose exec web python manage.py generate_readings --hours 48
```

**Auto-setup:** Migration, TimescaleDB hypertable, dan seed data otomatis.

**Akses:**
| Service | URL | Credentials |
|---------|-----|-------------|
| Dashboard | http://localhost:8000 | superuser |
| Admin | http://localhost:8000/admin | superuser |
| Grafana | http://localhost:3000 | admin / admin |

---

## Daily Commands

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Logs | `docker compose logs -f web` |
| Shell Django | `docker compose exec -it web python manage.py shell` |
| Shell PostgreSQL | `docker compose exec db psql -U smarthome` |
| Reset DB | `docker compose down -v && docker compose up -d` |

### PowerShell Scripts (Windows)

```powershell
.\scripts\start.ps1      # Build & start
.\scripts\stop.ps1       # Stop
.\scripts\restart.ps1    # Restart with rebuild
.\scripts\remove.ps1     # Remove containers, volumes, images
.\scripts\shell.ps1      # Interactive shell
```

---

## Systems & Device Types

### 🏠 Home Automation
| Type | Description |
|------|-------------|
| `light` | Smart lights |
| `ac` | Air conditioner |
| `camera` | CCTV camera |
| `sensor_temp` | Temperature sensor |
| `sensor_humidity` | Humidity sensor |
| `switch` | Generic switch |
| `valve` | Water valve |
| `motor` | Motor/pump |

### ☀️ Solar PV
| Type | Description |
|------|-------------|
| `pv_voltage` | Panel voltage (V) |
| `pv_current` | Panel current (A) |
| `pv_power` | Power output (W) |
| `pv_energy` | Energy counter (kWh) |
| `pv_panel_temp` | Panel temperature |
| `battery_voltage` | Battery voltage (V) |
| `battery_soc` | State of charge (%) |
| `battery_current` | Battery current (A) |
| `inverter` | Inverter on/off |
| `grid_power` | Grid import/export (W) |

### 🥬 Hydroponics
| Type | Description |
|------|-------------|
| `hydro_ph` | pH sensor |
| `hydro_ec` | Electrical conductivity (mS/cm) |
| `hydro_tds` | Total dissolved solids (ppm) |
| `hydro_water_temp` | Nutrient water temp |
| `hydro_water_level` | Tank level (%) |
| `hydro_flow` | Flow rate (L/min) |
| `hydro_light` | Grow light |
| `hydro_main_pump` | Main circulation pump |
| `hydro_nutrient_pump` | Nutrient dosing pump |
| `hydro_ph_up_pump` | pH up dosing pump |
| `hydro_ph_down_pump` | pH down dosing pump |
| `hydro_air_temp` | Air temperature |
| `hydro_air_humidity` | Air humidity |

### 🐟 Fishery (Gurame)
| Type | Description |
|------|-------------|
| `fish_water_temp` | Water temperature |
| `fish_ph` | Water pH |
| `fish_do` | Dissolved oxygen (mg/L) |
| `fish_ammonia` | Ammonia NH3 (mg/L) |
| `fish_nitrite` | Nitrite NO2 (mg/L) |
| `fish_nitrate` | Nitrate NO3 (mg/L) |
| `fish_turbidity` | Turbidity (NTU) |
| `fish_water_level` | Pond water level (%) |
| `fish_aerator` | Aerator pump |
| `fish_feeder` | Auto feeder |
| `fish_heater` | Water heater |
| `fish_drain_valve` | Drain valve |
| `fish_inlet_valve` | Water inlet valve |

---

## Managing Devices

### Via seed.json (Recommended)

Edit `app/fixtures/seed.json`:

```json
{
  "rooms": [
    {
      "name": "Room Name",
      "icon": "🏠",
      "category": "home",
      "devices": [
        {
          "name": "Device Name",
          "type": "sensor_temp",
          "unit": "°C",
          "min_value": 18,
          "max_value": 32
        },
        {
          "name": "Light Switch",
          "type": "light",
          "is_controllable": true
        }
      ]
    }
  ]
}
```

**Room categories:** `home`, `pv`, `hydro`, `fish`

**Device fields:**
| Field | Description |
|-------|-------------|
| `name` | Device display name |
| `type` | One of device types above |
| `unit` | Display unit (°C, %, V, pH, mg/L, etc.) |
| `min_value` | Minimum threshold (alert if below) |
| `max_value` | Maximum threshold (alert if above) |
| `is_controllable` | Can be toggled on/off |

Apply changes:
```bash
docker compose exec web python manage.py seed           # Add new only
docker compose exec web python manage.py seed --reset   # Full reset
```

### Via Django Admin

1. Buka http://localhost:8000/admin
2. Login dengan superuser
3. Tambah/edit **Rooms**, **Devices**, **Sensor Readings**

---

## Grafana Dashboards

### Generate Sample Data

```bash
# Generate 24 jam data (default)
docker compose exec web python manage.py generate_readings

# Generate 7 hari data
docker compose exec web python manage.py generate_readings --hours 168

# Clear & regenerate
docker compose exec web python manage.py generate_readings --clear --hours 48
```

### Available Dashboards

| Dashboard | Content |
|-----------|---------|
| **Smart Home** | Temperature, humidity, device status |
| **Solar PV** | Panel power, battery SoC, grid import/export |
| **Hydroponics** | pH/EC gauges, tank levels, pump status |
| **Fishery** | DO/pH gauges, water temp, ammonia levels |

Akses: http://localhost:3000 → Login `admin/admin`

### TimescaleDB Features

| Feature | Setting |
|---------|---------|
| Auto-partitioning | By timestamp (hypertable) |
| Compression | Data > 7 hari auto-compressed |
| Retention | Data > 90 hari auto-deleted |

Manual setup (jika perlu):
```bash
docker compose exec web python manage.py setup_timescale
```

---

## API Endpoints

### Device API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices/` | List all devices |
| GET | `/api/devices/?category=fish` | Filter by category |
| POST | `/api/toggle/<id>/` | Toggle device status |

### Historical Data API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sensors/<id>/history/` | Get sensor history |
| GET | `/api/sensors/summary/` | Get all sensors summary |
| GET | `/api/sensors/readings/` | Bulk fetch readings |

**Query parameters:**
- `range`: `1h`, `6h`, `24h`, `7d`, `30d` (default: 24h)
- `aggregate`: `none`, `hour`, `day` (auto-selected based on range)
- `category`: `home`, `pv`, `hydro`, `fish`

**Contoh:**
```bash
# Get 7 hari data sensor, aggregated per jam
curl "http://localhost:8000/api/sensors/1/history/?range=7d&aggregate=hour"

# Get semua device kategori fishery
curl "http://localhost:8000/api/devices/?category=fish"

# Bulk readings untuk device 1,2,3
curl "http://localhost:8000/api/sensors/readings/?ids=1,2,3&range=24h"
```

---

## Sensor Simulators

Simulators push random device updates via Redis. Default: **disabled**.

### Enable via .env

```env
SENSOR_LIGHT_ENABLED=true
SENSOR_TEMP_ENABLED=true
SENSOR_HUMIDITY_ENABLED=true
SENSOR_SWITCH_ENABLED=true
SENSOR_VALVE_ENABLED=true
SENSOR_MOTOR_ENABLED=true
```

### Manual Test

```bash
curl http://localhost:8000/simulate/
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | dev fallback | Secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `DATABASE_URL` | postgres://... | PostgreSQL connection |
| `SENSOR_*_ENABLED` | `false` | Enable simulators |

---

## Project Structure

```
smart-home/
├── app/
│   ├── core/                 # Settings, ASGI
│   ├── dashboard/
│   │   ├── models.py         # Room, Device, SensorReading
│   │   ├── views.py          # Views & API
│   │   ├── consumers.py      # WebSocket
│   │   └── management/       # Commands
│   │       └── commands/
│   │           ├── seed.py
│   │           ├── setup_timescale.py
│   │           └── generate_readings.py
│   └── fixtures/             # seed.json (18 rooms, 100+ devices)
├── grafana/
│   └── provisioning/
│       ├── datasources/      # TimescaleDB connection
│       └── dashboards/       # 4 JSON dashboards
├── sensors/                  # Simulator containers
├── scripts/                  # PowerShell scripts
└── docker-compose.yml
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000/3000 in use | Ganti port di `docker-compose.yml` |
| WebSocket disconnect | Cek Redis: `docker compose ps` |
| Grafana no data | Run `generate_readings` untuk sample data |
| TimescaleDB error | Run `setup_timescale` command |
| Login failed | Pastikan sudah `createsuperuser` |
| Category filter not working | Run `seed --reset` untuk update rooms |

### Reset Everything

```bash
docker compose down -v
docker compose up --build -d
docker compose exec -it web python manage.py createsuperuser
docker compose exec web python manage.py generate_readings --hours 48
```

### Check Database

```bash
# Connect ke PostgreSQL
docker compose exec db psql -U smarthome

# Check hypertable
\dx                                    # List extensions
SELECT * FROM timescaledb_information.hypertables;

# Check device count per category
SELECT r.category, COUNT(*)
FROM dashboard_device d
JOIN dashboard_room r ON d.room_id = r.id
GROUP BY r.category;

# Check sensor readings
SELECT COUNT(*) FROM dashboard_sensorreading;
```

---

## Theme

Klik icon sun/moon di header untuk toggle Dark/Light mode.

- **Dark theme:** Forest Green (#2B3E34, #546A50, #7E8A6D)
- **Light theme:** Warm Orange accent
