from django.shortcuts import render
from .models import Room, Device
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.cache import never_cache

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import JsonResponse
from random import choice


@login_required
@never_cache
def dashboard(request):
    rooms = Room.objects.prefetch_related("devices").all()
    return render(request, "dashboard.html", {"rooms": rooms})


@login_required
def simulate_update(request):
    channel_layer = get_channel_layer()

    payload = {
        "device": choice(["Living Light", "Bedroom AC", "Pump"]),
        "status": choice([True, False]),
    }

    async_to_sync(channel_layer.group_send)(
        "devices",
        {"type": "device_update", "data": payload},
    )

    return JsonResponse({"sent": payload})


def device_api(request):
    try:
        devices = list(
            Device.objects.select_related("room").values(
                "id", "name", "type", "status", "room__name",
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
    return JsonResponse({"id": device.id, "status": device.status})
