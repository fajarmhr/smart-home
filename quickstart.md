# Quickstart

## Prerequisites

- Docker & Docker Compose
- Git (optional)

## Install & Run

```bash
# 1. Masuk ke project
cd smart-home

# 2. Build & jalankan containers
docker compose up --build -d

# 3. Jalankan migrasi database
docker exec smart-home-web python manage.py migrate

# 4. Buat akun admin
docker exec -it smart-home-web python manage.py createsuperuser

# 5. Buka browser
# Dashboard: http://localhost:8000
# Admin:     http://localhost:8000/admin
```

## Tambah Data (Pertama Kali)

1. Buka `http://localhost:8000/admin`
2. Login dengan akun superuser
3. Tambah **Room** (contoh: Living Room, Bedroom, Kitchen)
4. Tambah **Device** — pilih room, type (light/ac/sensor), nama
5. Buka `http://localhost:8000` — device muncul di dashboard

## Daily Use

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Lihat logs
docker compose logs -f web

# Reset database
docker exec smart-home-web python manage.py flush

# Reset password user
docker exec -it smart-home-web python manage.py changepassword <username>

# Hapus semua user & buat ulang
docker exec -it smart-home-web python manage.py shell -c "from django.contrib.auth.models import User; User.objects.all().delete()"
docker exec -it smart-home-web python manage.py createsuperuser
```

## Test WebSocket

Buka dashboard, lalu di tab/terminal lain:

```bash
curl http://localhost:8000/simulate/
```

Device status akan berubah secara real-time di dashboard.

## Ganti Theme

Klik icon sun/moon di header (dashboard) atau kanan atas (login). Pilihan tersimpan di browser.

## Environment Variables (Opsional)

Buat file `.env` di root project:

```env
DJANGO_SECRET_KEY=ganti-dengan-key-random-panjang
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

Lalu restart: `docker compose up -d`

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port 8000 sudah dipakai | Ganti port di `docker-compose.yml`: `"8001:8000"` |
| WebSocket disconnect | Pastikan Redis jalan: `docker compose ps` |
| Static files tidak muncul | Pastikan `DEBUG=True` atau jalankan `collectstatic` |
| Login gagal | Pastikan sudah `createsuperuser` dan `migrate` |
