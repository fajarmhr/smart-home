from django.contrib import admin
from .models import Room, Device, SensorReading


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "device_count")
    search_fields = ("name",)

    def device_count(self, obj):
        return obj.devices.count()
    device_count.short_description = "Devices"


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("name", "room", "type", "status", "value")
    list_filter = ("type", "status", "room")
    search_fields = ("name", "room__name")
    list_editable = ("status",)


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = ("device", "value", "timestamp")
    list_filter = ("device__type", "device__room", "device")
    search_fields = ("device__name",)
    date_hierarchy = "timestamp"
    ordering = ("-timestamp",)
