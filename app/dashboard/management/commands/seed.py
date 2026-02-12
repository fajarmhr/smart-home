import json
from pathlib import Path
from django.core.management.base import BaseCommand
from dashboard.models import Room, Device


class Command(BaseCommand):
    help = "Seed rooms and devices from fixtures/seed.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing rooms & devices before seeding",
        )
        parser.add_argument(
            "--file",
            type=str,
            default=None,
            help="Path to seed JSON file (default: fixtures/seed.json)",
        )

    def handle(self, *args, **options):
        # Resolve seed file path
        if options["file"]:
            seed_path = Path(options["file"])
        else:
            seed_path = Path(__file__).resolve().parents[3] / "fixtures" / "seed.json"

        if not seed_path.exists():
            self.stderr.write(self.style.ERROR(f"Seed file not found: {seed_path}"))
            return

        with open(seed_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if options["reset"]:
            Device.objects.all().delete()
            Room.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared all rooms & devices."))

        rooms_created = 0
        devices_created = 0
        devices_skipped = 0

        for room_data in data.get("rooms", []):
            room, created = Room.objects.get_or_create(
                name=room_data["name"],
                defaults={
                    "icon": room_data.get("icon", "🏠"),
                    "category": room_data.get("category", "home"),
                },
            )
            if created:
                rooms_created += 1
            else:
                # Update existing room's category and icon if changed
                updated = False
                if room.category != room_data.get("category", "home"):
                    room.category = room_data.get("category", "home")
                    updated = True
                if room.icon != room_data.get("icon", "🏠"):
                    room.icon = room_data.get("icon", "🏠")
                    updated = True
                if updated:
                    room.save()

            for device_data in room_data.get("devices", []):
                _, d_created = Device.objects.get_or_create(
                    name=device_data["name"],
                    room=room,
                    defaults={
                        "type": device_data["type"],
                        "status": device_data.get("status", False),
                        "unit": device_data.get("unit", ""),
                        "min_value": device_data.get("min_value"),
                        "max_value": device_data.get("max_value"),
                        "is_controllable": device_data.get("is_controllable", False),
                    },
                )
                if d_created:
                    devices_created += 1
                else:
                    devices_skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {rooms_created} rooms created, "
                f"{devices_created} devices created, "
                f"{devices_skipped} devices skipped (already exist)."
            )
        )
