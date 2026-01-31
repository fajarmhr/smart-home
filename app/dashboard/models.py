from django.db import models

class Room(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, default="🏠")

    def __str__(self):
        return self.name


class Device(models.Model):
    DEVICE_TYPE = (
        ("light", "Light"),
        ("ac", "AC"),
        ("sensor", "Sensor"),
    )

    name = models.CharField(max_length=100)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="devices")
    type = models.CharField(max_length=20, choices=DEVICE_TYPE)
    status = models.BooleanField(default=False)

    def __str__(self):
        return self.name
