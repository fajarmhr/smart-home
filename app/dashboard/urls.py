from django.urls import path
from .views import dashboard, simulate_update, device_api, toggle_device_api

urlpatterns = [
    path("", dashboard, name="dashboard"),
    path("simulate/", simulate_update),
    path("api/devices/", device_api),
    path("api/toggle/<int:device_id>/", toggle_device_api),
]
