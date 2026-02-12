from django.shortcuts import render
from .models import Room, Device, SensorReading
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.cache import never_cache
from django.utils import timezone
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import JsonResponse
from django.db.models import Avg
from django.db.models.functions import TruncHour, TruncDay
from random import choice


@login_required
@never_cache
def dashboard(request):
    # Get category filter from query param
    category = request.GET.get("category", "all")

    if category == "all":
        rooms = Room.objects.prefetch_related("devices").all()
    else:
        rooms = Room.objects.prefetch_related("devices").filter(category=category)

    # Group rooms by category for sidebar
    categories = {
        "home": {"name": "Home", "icon": "🏠", "rooms": []},
        "pv": {"name": "Solar PV", "icon": "☀️", "rooms": []},
        "hydro": {"name": "Hydroponics", "icon": "🥬", "rooms": []},
        "fish": {"name": "Fishery", "icon": "🐟", "rooms": []},
    }

    all_rooms = Room.objects.prefetch_related("devices").all()
    for room in all_rooms:
        if room.category in categories:
            categories[room.category]["rooms"].append(room)

    return render(request, "dashboard.html", {
        "rooms": rooms,
        "categories": categories,
        "current_category": category,
    })


@login_required
def simulate_update(request):
    channel_layer = get_channel_layer()

    device_names = list(Device.objects.values_list("name", flat=True))
    if not device_names:
        device_names = ["No devices"]

    payload = {
        "device": choice(device_names),
        "status": choice([True, False]),
    }

    async_to_sync(channel_layer.group_send)(
        "devices",
        {"type": "device_update", "data": payload},
    )

    return JsonResponse({"sent": payload})


def device_api(request):
    """List all devices with optional category filter"""
    try:
        category = request.GET.get("category")
        queryset = Device.objects.select_related("room")

        if category:
            queryset = queryset.filter(room__category=category)

        devices = list(
            queryset.values(
                "id", "name", "type", "status", "value", "unit",
                "min_value", "max_value", "is_controllable",
                "room__name", "room__category",
            )
        )
        return JsonResponse(devices, safe=False)
    except Exception:
        return JsonResponse({"error": "Failed to fetch devices"}, status=500)


@require_POST
def toggle_device_api(request, device_id):
    try:
        device = Device.objects.get(id=device_id)
    except Device.DoesNotExist:
        return JsonResponse({"error": "Device not found"}, status=404)

    device.status = not device.status
    device.save()

    # Broadcast to all WebSocket clients
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "devices",
        {
            "type": "device_update",
            "data": {
                "device": device.name,
                "status": device.status,
            },
        },
    )

    return JsonResponse({"id": device.id, "status": device.status})


# ===== Historical Data API =====

@login_required
def sensor_history_api(request, device_id):
    """
    Get historical readings for a specific device.

    Query params:
    - range: 1h, 6h, 24h, 7d, 30d (default: 24h)
    - aggregate: none, hour, day (default: none for <24h, hour for >=24h)
    """
    try:
        device = Device.objects.get(id=device_id)
    except Device.DoesNotExist:
        return JsonResponse({"error": "Device not found"}, status=404)

    # Parse time range
    range_param = request.GET.get("range", "24h")
    range_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    time_range = range_map.get(range_param, timedelta(hours=24))

    since = timezone.now() - time_range

    # Determine aggregation
    aggregate = request.GET.get("aggregate")
    if aggregate is None:
        # Auto-select based on range
        if time_range <= timedelta(hours=24):
            aggregate = "none"
        elif time_range <= timedelta(days=7):
            aggregate = "hour"
        else:
            aggregate = "day"

    readings = SensorReading.objects.filter(
        device=device,
        timestamp__gte=since
    )

    if aggregate == "hour":
        readings = (
            readings
            .annotate(period=TruncHour("timestamp"))
            .values("period")
            .annotate(avg_value=Avg("value"))
            .order_by("period")
        )
        data = [
            {"timestamp": r["period"].isoformat(), "value": round(r["avg_value"], 2)}
            for r in readings
        ]
    elif aggregate == "day":
        readings = (
            readings
            .annotate(period=TruncDay("timestamp"))
            .values("period")
            .annotate(avg_value=Avg("value"))
            .order_by("period")
        )
        data = [
            {"timestamp": r["period"].isoformat(), "value": round(r["avg_value"], 2)}
            for r in readings
        ]
    else:
        # No aggregation - raw data
        readings = readings.order_by("timestamp").values("timestamp", "value")[:1000]
        data = [
            {"timestamp": r["timestamp"].isoformat(), "value": r["value"]}
            for r in readings
        ]

    return JsonResponse({
        "device_id": device.id,
        "device_name": device.name,
        "device_type": device.type,
        "range": range_param,
        "aggregate": aggregate,
        "data": data,
    })


@login_required
def sensors_summary_api(request):
    """
    Get latest readings for all sensor devices.
    Returns current value and 24h min/max/avg for each sensor.
    """
    sensor_types = ["sensor_temp", "sensor_humidity", "sensor"]
    sensors = Device.objects.filter(type__in=sensor_types).select_related("room")

    since_24h = timezone.now() - timedelta(hours=24)

    result = []
    for sensor in sensors:
        # Get 24h stats
        stats = SensorReading.objects.filter(
            device=sensor,
            timestamp__gte=since_24h
        ).aggregate(
            avg=Avg("value"),
        )

        # Get latest reading
        latest = SensorReading.objects.filter(device=sensor).order_by("-timestamp").first()

        result.append({
            "id": sensor.id,
            "name": sensor.name,
            "type": sensor.type,
            "room": sensor.room.name,
            "current_value": sensor.value,
            "latest_reading": {
                "value": latest.value if latest else None,
                "timestamp": latest.timestamp.isoformat() if latest else None,
            },
            "stats_24h": {
                "avg": round(stats["avg"], 2) if stats["avg"] else None,
            },
        })

    return JsonResponse({"sensors": result})


@login_required
def readings_bulk_api(request):
    """
    Get readings for multiple devices at once.

    Query params:
    - ids: comma-separated device IDs (e.g., ids=1,2,3)
    - range: 1h, 6h, 24h, 7d (default: 24h)
    """
    ids_param = request.GET.get("ids", "")
    if not ids_param:
        return JsonResponse({"error": "Missing 'ids' parameter"}, status=400)

    try:
        device_ids = [int(x.strip()) for x in ids_param.split(",")]
    except ValueError:
        return JsonResponse({"error": "Invalid device IDs"}, status=400)

    range_param = request.GET.get("range", "24h")
    range_map = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
    }
    time_range = range_map.get(range_param, timedelta(hours=24))
    since = timezone.now() - time_range

    devices = Device.objects.filter(id__in=device_ids)

    result = {}
    for device in devices:
        readings = (
            SensorReading.objects
            .filter(device=device, timestamp__gte=since)
            .annotate(period=TruncHour("timestamp"))
            .values("period")
            .annotate(avg_value=Avg("value"))
            .order_by("period")
        )
        result[device.id] = {
            "name": device.name,
            "type": device.type,
            "data": [
                {"timestamp": r["period"].isoformat(), "value": round(r["avg_value"], 2)}
                for r in readings
            ]
        }

    return JsonResponse({"range": range_param, "devices": result})
