# Smart Home - Analisis & Optimasi

## Status Saat Ini

Proyek smart home Django dengan 1 app (`dashboard`), 2 model (`Room`, `Device`),
WebSocket via Channels + Redis, UI Tailwind CSS. Docker Compose: 2 container (`web`, `redis`).

---

## Optimasi yang Sudah Diterapkan

### 1. `.dockerignore` (Docker Build)
- Menambahkan file `.dockerignore` untuk exclude `db.sqlite3`, `__pycache__`, `.git`, dll
- Build context jadi lebih kecil dan cepat

### 2. `SECRET_KEY` via Environment Variable (Security)
- `SECRET_KEY` dipindah dari hardcode ke `os.environ.get()` dengan fallback untuk dev
- Di `docker-compose.yml` ditambahkan `environment` block
- Untuk production, ganti value di env var atau gunakan `.env` file

### 3. Pemisahan JavaScript ke Static File (Maintainability)
- `dashboard.html` inline JS (~90 baris) dipindah ke `static/dashboard/js/dashboard.js`
- `login.html` inline JS dipindah ke `static/dashboard/js/theme.js` (shared)
- Template sekarang hanya load `{% static %}` tags

### 4. Pemisahan CSS ke Static File (Maintainability)
- Custom styles (gradient backgrounds, glassmorphism) dipindah ke `static/dashboard/css/style.css`
- Tetap pakai Tailwind CDN untuk utility classes (bisa diganti build step nanti)
- CSS custom properties untuk theme colors agar mudah di-maintain

### 5. Error Handling di API Views (Reliability)
- `toggle_device_api`: ditambah try/except untuk `Device.DoesNotExist` → return 404
- `device_api`: ditambah try/except generic → return 500
- `simulate_update`: ditambah auth check (`@login_required`)
- Semua error response dalam format JSON konsisten

### 6. `ALLOWED_HOSTS` (Security)
- Ditambahkan `["localhost", "127.0.0.1", "0.0.0.0"]`
- Dibaca dari env var `ALLOWED_HOSTS` agar fleksibel di production

### 7. Docker Optimization
- Ditambahkan `healthcheck` untuk Redis container
- Ditambahkan `restart: unless-stopped` untuk kedua service
- Ditambahkan `environment` block untuk konfigurasi via env var
- Ditambahkan `daphne` di requirements untuk ASGI server (pengganti runserver)

---

## Rekomendasi Selanjutnya (Belum Diterapkan)

### Arsitektur Sensor per Container
- Buat Django app terpisah per sensor type (`sensor_temperature`, `sensor_humidity`, dll)
- Masing-masing jadi service di `docker-compose.yml`
- Komunikasi via Redis pub/sub (infrastruktur sudah ada)

### Database
- Ganti SQLite ke PostgreSQL (container tambahan) untuk concurrent writes
- Pertimbangkan TimescaleDB untuk time-series sensor data

### Frontend Build Pipeline
- Ganti Tailwind CDN → local build dengan PostCSS/Vite
- Tree-shaking untuk production bundle yang lebih kecil

### Model Sensor
- Tambah `SensorReading` model dengan `value`, `unit`, `timestamp`
- Atau extend `Device` model dengan field opsional untuk sensor data
