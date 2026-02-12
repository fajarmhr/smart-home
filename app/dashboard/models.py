from django.db import models


class Room(models.Model):
    ROOM_CATEGORY = (
        ("home", "Home"),
        ("pv", "Solar PV"),
        ("hydro", "Hydroponics"),
        ("fish", "Fishery"),
    )

    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default="🏠")
    category = models.CharField(max_length=20, choices=ROOM_CATEGORY, default="home")

    def __str__(self):
        return self.name


class Device(models.Model):
    DEVICE_TYPE = (
        # ===== Home =====
        ("light", "Light"),
        ("ac", "AC"),
        ("sensor", "Sensor"),
        ("camera", "Camera"),
        ("sensor_temp", "Temperature Sensor"),
        ("sensor_humidity", "Humidity Sensor"),
        ("switch", "Switch"),
        ("valve", "Valve"),
        ("motor", "Motor"),

        # ===== Solar PV =====
        ("pv_voltage", "PV Voltage"),
        ("pv_current", "PV Current"),
        ("pv_power", "PV Power"),
        ("pv_energy", "PV Energy"),
        ("pv_panel_temp", "PV Panel Temp"),
        ("battery_voltage", "Battery Voltage"),
        ("battery_soc", "Battery SoC"),
        ("battery_current", "Battery Current"),
        ("inverter", "Inverter"),
        ("grid_power", "Grid Power"),

        # ===== Hydroponics =====
        ("hydro_ph", "Hydro pH"),
        ("hydro_ec", "Hydro EC"),
        ("hydro_tds", "Hydro TDS"),
        ("hydro_water_temp", "Hydro Water Temp"),
        ("hydro_water_level", "Hydro Water Level"),
        ("hydro_flow", "Hydro Flow Rate"),
        ("hydro_light", "Grow Light"),
        ("hydro_nutrient_pump", "Nutrient Pump"),
        ("hydro_ph_up_pump", "pH Up Pump"),
        ("hydro_ph_down_pump", "pH Down Pump"),
        ("hydro_main_pump", "Main Pump"),
        ("hydro_air_temp", "Hydro Air Temp"),
        ("hydro_air_humidity", "Hydro Air Humidity"),

        # ===== Fishery =====
        ("fish_water_temp", "Fish Water Temp"),
        ("fish_ph", "Fish pH"),
        ("fish_do", "Dissolved Oxygen"),
        ("fish_ammonia", "Ammonia"),
        ("fish_nitrite", "Nitrite"),
        ("fish_nitrate", "Nitrate"),
        ("fish_turbidity", "Turbidity"),
        ("fish_water_level", "Fish Water Level"),
        ("fish_aerator", "Aerator"),
        ("fish_feeder", "Auto Feeder"),
        ("fish_heater", "Fish Heater"),
        ("fish_drain_valve", "Drain Valve"),
        ("fish_inlet_valve", "Inlet Valve"),
    )

    name = models.CharField(max_length=100)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="devices")
    type = models.CharField(max_length=20, choices=DEVICE_TYPE)
    status = models.BooleanField(default=False)
    value = models.FloatField(null=True, blank=True, help_text="Sensor reading value")
    unit = models.CharField(max_length=20, blank=True, default="", help_text="Unit (°C, %, V, A, W, pH, ppm, mg/L)")
    min_value = models.FloatField(null=True, blank=True, help_text="Min threshold for alerts")
    max_value = models.FloatField(null=True, blank=True, help_text="Max threshold for alerts")
    is_controllable = models.BooleanField(default=False, help_text="Can be toggled on/off")

    def __str__(self):
        return f"{self.room.name} - {self.name}"

    @property
    def is_critical(self):
        """Check if value is outside safe range"""
        if self.value is None:
            return False
        if self.min_value and self.value < self.min_value:
            return True
        if self.max_value and self.value > self.max_value:
            return True
        return False


class SensorReading(models.Model):
    """
    Time-series data for sensor readings.
    Optimized with TimescaleDB hypertable for efficient time-based queries.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="readings")
    value = models.FloatField(help_text="Sensor value")
    timestamp = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["device", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"{self.device.name}: {self.value} @ {self.timestamp}"
