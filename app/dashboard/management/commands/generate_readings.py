import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from dashboard.models import Device, SensorReading


class Command(BaseCommand):
    help = "Generate sample sensor readings for testing/demo"

    # Sensor type configurations: (base_value, variation, daily_pattern)
    SENSOR_CONFIGS = {
        # Home sensors
        "sensor_temp": {"base": 26.0, "var": 4.0, "pattern": "temp"},
        "sensor_humidity": {"base": 60.0, "var": 20.0, "pattern": "humidity"},

        # Fishery sensors
        "fish_water_temp": {"base": 28.0, "var": 2.0, "pattern": "water_temp"},
        "fish_ph": {"base": 7.2, "var": 0.5, "pattern": "stable"},
        "fish_do": {"base": 6.5, "var": 1.5, "pattern": "do"},
        "fish_ammonia": {"base": 0.01, "var": 0.01, "pattern": "stable"},
        "fish_nitrite": {"base": 0.02, "var": 0.01, "pattern": "stable"},
        "fish_water_level": {"base": 85.0, "var": 10.0, "pattern": "stable"},
        "fish_turbidity": {"base": 15.0, "var": 5.0, "pattern": "stable"},

        # Hydroponics sensors
        "hydro_ph": {"base": 5.8, "var": 0.4, "pattern": "stable"},
        "hydro_ec": {"base": 1.8, "var": 0.4, "pattern": "stable"},
        "hydro_water_temp": {"base": 22.0, "var": 2.0, "pattern": "water_temp"},
        "hydro_air_temp": {"base": 25.0, "var": 3.0, "pattern": "temp"},
        "hydro_air_humidity": {"base": 65.0, "var": 15.0, "pattern": "humidity"},
        "hydro_water_level": {"base": 70.0, "var": 15.0, "pattern": "decreasing"},
        "hydro_light_level": {"base": 500.0, "var": 200.0, "pattern": "light"},

        # Solar PV sensors
        "pv_voltage": {"base": 38.0, "var": 8.0, "pattern": "solar"},
        "pv_current": {"base": 8.0, "var": 4.0, "pattern": "solar"},
        "pv_power": {"base": 280.0, "var": 200.0, "pattern": "solar"},
        "pv_panel_temp": {"base": 45.0, "var": 15.0, "pattern": "panel_temp"},
        "pv_energy": {"base": 3.5, "var": 1.5, "pattern": "energy"},
        "battery_voltage": {"base": 52.0, "var": 4.0, "pattern": "battery"},
        "battery_soc": {"base": 75.0, "var": 25.0, "pattern": "battery"},
        "battery_current": {"base": 5.0, "var": 10.0, "pattern": "battery_current"},
        "grid_power": {"base": 100.0, "var": 300.0, "pattern": "grid"},
        "inverter_power": {"base": 250.0, "var": 200.0, "pattern": "solar"},
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=24,
            help="Generate readings for the past N hours (default: 24)",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=5,
            help="Interval between readings in minutes (default: 5)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing readings before generating",
        )
        parser.add_argument(
            "--category",
            type=str,
            default="all",
            help="Generate for specific category: home, fish, hydro, pv, or all (default: all)",
        )

    def get_daily_offset(self, pattern, hour_of_day):
        """Get daily offset based on pattern type"""
        if pattern == "temp":
            # Temperature: warmer during day (10-18), cooler at night
            if 10 <= hour_of_day <= 18:
                return 2.0
            return -1.5

        elif pattern == "humidity":
            # Humidity: higher in early morning, lower during day
            if 5 <= hour_of_day <= 8:
                return 10.0
            elif 12 <= hour_of_day <= 16:
                return -10.0
            return 0.0

        elif pattern == "water_temp":
            # Water temp: more stable, slight increase in afternoon
            if 14 <= hour_of_day <= 18:
                return 0.5
            elif 2 <= hour_of_day <= 6:
                return -0.3
            return 0.0

        elif pattern == "do":
            # Dissolved oxygen: lower in early morning, higher during day (photosynthesis)
            if 6 <= hour_of_day <= 10:
                return -0.5
            elif 12 <= hour_of_day <= 16:
                return 0.5
            return 0.0

        elif pattern == "solar":
            # Solar production: follows sun, zero at night
            if hour_of_day < 6 or hour_of_day > 18:
                return -1000  # Signal for zero
            elif 10 <= hour_of_day <= 14:
                return 0.3  # Peak hours boost
            elif 6 <= hour_of_day <= 8 or 16 <= hour_of_day <= 18:
                return -0.5  # Lower in morning/evening
            return 0.0

        elif pattern == "panel_temp":
            # Panel temp: follows solar + ambient
            if hour_of_day < 6 or hour_of_day > 19:
                return -20.0
            elif 11 <= hour_of_day <= 15:
                return 10.0
            return 0.0

        elif pattern == "battery":
            # Battery: charges during day, discharges at night
            if 10 <= hour_of_day <= 14:
                return 10.0  # Charging
            elif 18 <= hour_of_day <= 22:
                return -10.0  # Discharging
            return 0.0

        elif pattern == "battery_current":
            # Positive during charging, negative during discharge
            if 10 <= hour_of_day <= 14:
                return 5.0
            elif 18 <= hour_of_day <= 22:
                return -8.0
            return 0.0

        elif pattern == "grid":
            # Grid: importing at night/morning, exporting midday
            if 10 <= hour_of_day <= 14:
                return -150.0  # Exporting (negative)
            elif 18 <= hour_of_day <= 22:
                return 100.0  # Importing
            return 0.0

        elif pattern == "light":
            # Grow light: on during day cycle
            if 6 <= hour_of_day <= 20:
                return 200.0
            return -400.0

        elif pattern == "decreasing":
            # Tank level: slowly decreases over time
            return -2.0 * (hour_of_day / 24)

        elif pattern == "energy":
            # Daily energy: accumulates during day
            if 6 <= hour_of_day <= 18:
                return hour_of_day * 0.3
            return 0.0

        # stable pattern - no daily offset
        return 0.0

    def handle(self, *args, **options):
        hours = options["hours"]
        interval = options["interval"]
        clear = options["clear"]
        category = options["category"]

        if clear:
            deleted, _ = SensorReading.objects.all().delete()
            self.stdout.write(f"Cleared {deleted} existing readings")

        # Get sensor devices based on category
        sensor_types = list(self.SENSOR_CONFIGS.keys())

        if category == "all":
            sensors = Device.objects.filter(type__in=sensor_types)
        else:
            # Filter by room category
            category_prefixes = {
                "home": ["sensor_"],
                "fish": ["fish_"],
                "hydro": ["hydro_"],
                "pv": ["pv_", "battery_", "grid_", "inverter_"],
            }
            if category not in category_prefixes:
                self.stdout.write(
                    self.style.ERROR(f"Unknown category: {category}. Use: home, fish, hydro, pv, or all")
                )
                return

            prefixes = category_prefixes[category]
            matching_types = [t for t in sensor_types if any(t.startswith(p) for p in prefixes)]
            sensors = Device.objects.filter(
                type__in=matching_types,
                room__category=category
            )

        if not sensors.exists():
            self.stdout.write(
                self.style.WARNING(f"No sensor devices found for category '{category}'. Run 'manage.py seed' first.")
            )
            return

        now = timezone.now()
        start_time = now - timedelta(hours=hours)
        readings_to_create = []

        for sensor in sensors:
            config = self.SENSOR_CONFIGS.get(sensor.type)
            if not config:
                continue

            base_value = config["base"]
            variation = config["var"]
            pattern = config["pattern"]

            current_time = start_time

            while current_time <= now:
                hour_of_day = current_time.hour
                daily_offset = self.get_daily_offset(pattern, hour_of_day)

                # Special handling for solar pattern at night
                if pattern == "solar" and daily_offset == -1000:
                    value = 0.0
                else:
                    value = base_value + daily_offset + random.uniform(-variation/2, variation/2)

                # Ensure non-negative values for most sensors
                if sensor.type not in ["battery_current", "grid_power"]:
                    value = max(0, value)

                # Clamp percentage values
                if "soc" in sensor.type or "level" in sensor.type or "humidity" in sensor.type:
                    value = min(100, max(0, value))

                value = round(value, 2)

                readings_to_create.append(
                    SensorReading(
                        device=sensor,
                        value=value,
                        timestamp=current_time,
                    )
                )

                current_time += timedelta(minutes=interval)

        # Bulk create for performance
        SensorReading.objects.bulk_create(readings_to_create, batch_size=1000)

        self.stdout.write(
            self.style.SUCCESS(
                f"Generated {len(readings_to_create)} readings "
                f"for {sensors.count()} sensors "
                f"(past {hours} hours, {interval}min interval)"
            )
        )
