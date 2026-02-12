from django.urls import path
from .views import (
    dashboard,
    simulate_update,
    device_api,
    toggle_device_api,
    sensor_history_api,
    sensors_summary_api,
    readings_bulk_api,
)

urlpatterns = [
    path("", dashboard, name="dashboard"),
    path("simulate/", simulate_update),
    path("api/devices/", device_api),
    path("api/toggle/<int:device_id>/", toggle_device_api),
    # Historical data API
    path("api/sensors/<int:device_id>/history/", sensor_history_api),
    path("api/sensors/summary/", sensors_summary_api),
    path("api/sensors/readings/", readings_bulk_api),
]
