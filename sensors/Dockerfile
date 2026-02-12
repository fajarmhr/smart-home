FROM python:3.11-slim

WORKDIR /sensor

RUN pip install --no-cache-dir redis

COPY simulator.py .

CMD ["python", "-u", "simulator.py"]
