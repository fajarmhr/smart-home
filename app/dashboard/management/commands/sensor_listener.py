"""
Listens to Redis pub/sub channel 'smart-home:sensors' for simulator messages.
Processes them into DB updates and pushes to WebSocket via Channels.
"""

import json
import random
import redis
from django.core.management.base import BaseCommand
from django.conf import settings
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from dashboard.models import Device


class Command(BaseCommand):
    help = "Listen to sensor simulator messages from Redis and update devices"

    def handle(self, *args, **options):
        redis_host = settings.CHANNEL_LAYERS["default"]["CONFIG"]["hosts"][0]
        if isinstance(redis_host, tuple):
            host, port = redis_host
        else:
            host, port = "redis", 6379

        r = redis.Redis(host=host, port=port, decode_responses=True)
        pubsub = r.pubsub()
        pubsub.subscribe("smart-home:sensors")

        self.stdout.write(self.style.SUCCESS(
            f"[Sensor Listener] Subscribed to smart-home:sensors on {host}:{port}"
        ))

        channel_layer = get_channel_layer()

        for message in pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                payload = json.loads(message["data"])
                data = payload.get("data", {})
                device_type = data.get("device_type")
                action = data.get("action")

                if not device_type:
                    continue

                # Get all devices of this type
                devices = list(Device.objects.filter(type=device_type))
                if not devices:
                    continue

                # Pick a random device of this type
                device = random.choice(devices)

                if action == "toggle":
                    device.status = not device.status
                    device.save(update_fields=["status"])

                    ws_payload = {
                        "device": device.name,
                        "status": device.status,
                        "value": device.value,
                    }

                elif action == "value":
                    value = data.get("value")
                    device.status = True  # sensor is active when reporting
                    device.value = value
                    device.save(update_fields=["status", "value"])

                    ws_payload = {
                        "device": device.name,
                        "status": device.status,
                        "value": value,
                    }
                else:
                    continue

                # Push to WebSocket
                async_to_sync(channel_layer.group_send)(
                    "devices",
                    {"type": "device_update", "data": ws_payload},
                )

                self.stdout.write(
                    f"[{device_type}] {device.name} => "
                    f"status={device.status}, value={device.value}"
                )

            except Exception as e:
                self.stderr.write(f"[Sensor Listener] Error: {e}")
