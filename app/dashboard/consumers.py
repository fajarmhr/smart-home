import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DeviceConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_name = "devices"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Optional: handle incoming message
        pass

    async def device_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))
