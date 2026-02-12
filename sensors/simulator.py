"""
Smart Home — Sensor Simulator
Connects to Redis and publishes device updates for a specific device type.
Configured via environment variables.
"""

import os
import json
import time
import random
import redis

# --- Config from env ---
SENSOR_TYPE = os.environ.get("SENSOR_TYPE", "light")
REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
INTERVAL_MIN = int(os.environ.get("INTERVAL_MIN", 15))
INTERVAL_MAX = int(os.environ.get("INTERVAL_MAX", 45))
ENABLED = os.environ.get("SIMULATOR_ENABLED", "true").lower() in ("true", "1", "yes")

# --- Sensor behavior profiles ---
PROFILES = {
    "light": {
        "has_value": False,
        "interval": (15, 45),
    },
    "camera": {
        "has_value": False,
        "interval": (30, 90),
    },
    "sensor_temp": {
        "has_value": True,
        "value_min": 20.0,
        "value_max": 35.0,
        "drift": 0.5,
        "unit": "°C",
        "interval": (10, 30),
    },
    "sensor_humidity": {
        "has_value": True,
        "value_min": 40.0,
        "value_max": 80.0,
        "drift": 2.0,
        "unit": "%",
        "interval": (10, 30),
    },
    "switch": {
        "has_value": False,
        "interval": (20, 60),
    },
    "valve": {
        "has_value": False,
        "interval": (30, 120),
    },
    "motor": {
        "has_value": False,
        "interval": (30, 120),
    },
}


def get_profile():
    return PROFILES.get(SENSOR_TYPE, {"has_value": False, "interval": (15, 45)})


def wait_for_redis(r, retries=30, delay=2):
    """Wait for Redis to be available."""
    for i in range(retries):
        try:
            r.ping()
            print(f"[{SENSOR_TYPE}] Connected to Redis")
            return True
        except redis.ConnectionError:
            print(f"[{SENSOR_TYPE}] Waiting for Redis... ({i+1}/{retries})")
            time.sleep(delay)
    print(f"[{SENSOR_TYPE}] Failed to connect to Redis")
    return False


def publish_update(r, device_name, status, value=None):
    """Publish a device update via Redis channel layer (Django Channels format)."""
    data = {
        "device": device_name,
        "status": status,
    }
    if value is not None:
        data["value"] = round(value, 1)

    # Django Channels Redis uses a specific message format
    message = {
        "type": "device_update",
        "data": data,
    }

    # Publish to the Channels group via Redis
    # channels_redis uses asgi: prefix by default
    r.publish("asgi:group:devices", json.dumps(message))
    print(f"[{SENSOR_TYPE}] {device_name} => status={status}, value={value}")


def run_toggle_simulator(r, profile):
    """Simulator for on/off devices (light, camera, switch, valve, motor)."""
    interval = profile.get("interval", (INTERVAL_MIN, INTERVAL_MAX))

    while True:
        # Publish a random toggle for this device type
        payload = {
            "type": "device_update",
            "data": {
                "device_type": SENSOR_TYPE,
                "action": "toggle",
            }
        }
        r.publish("smart-home:sensors", json.dumps(payload))
        print(f"[{SENSOR_TYPE}] Published toggle signal")

        delay = random.randint(interval[0], interval[1])
        time.sleep(delay)


def run_value_simulator(r, profile):
    """Simulator for sensors with numeric values (temp, humidity)."""
    interval = profile.get("interval", (INTERVAL_MIN, INTERVAL_MAX))
    v_min = profile["value_min"]
    v_max = profile["value_max"]
    drift = profile["drift"]
    unit = profile.get("unit", "")

    # Start with a random value in range
    current_value = random.uniform(v_min, v_max)

    while True:
        # Drift the value randomly
        change = random.uniform(-drift, drift)
        current_value = max(v_min, min(v_max, current_value + change))

        payload = {
            "type": "device_update",
            "data": {
                "device_type": SENSOR_TYPE,
                "action": "value",
                "value": round(current_value, 1),
                "unit": unit,
            }
        }
        r.publish("smart-home:sensors", json.dumps(payload))
        print(f"[{SENSOR_TYPE}] Published value: {round(current_value, 1)}{unit}")

        delay = random.randint(interval[0], interval[1])
        time.sleep(delay)


def main():
    if not ENABLED:
        print(f"[{SENSOR_TYPE}] Simulator disabled. Sleeping...")
        while True:
            time.sleep(3600)

    print(f"[{SENSOR_TYPE}] Starting simulator...")
    print(f"[{SENSOR_TYPE}] Redis: {REDIS_HOST}:{REDIS_PORT}")

    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

    if not wait_for_redis(r):
        return

    profile = get_profile()

    # Small initial delay to let web container start first
    startup_delay = random.randint(5, 15)
    print(f"[{SENSOR_TYPE}] Waiting {startup_delay}s before starting...")
    time.sleep(startup_delay)

    if profile.get("has_value"):
        run_value_simulator(r, profile)
    else:
        run_toggle_simulator(r, profile)


if __name__ == "__main__":
    main()
