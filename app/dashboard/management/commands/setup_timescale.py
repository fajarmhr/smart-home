from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Setup TimescaleDB extension and convert sensor_readings to hypertable"

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if using PostgreSQL
            if connection.vendor != "postgresql":
                self.stdout.write(
                    self.style.WARNING("Not using PostgreSQL, skipping TimescaleDB setup")
                )
                return

            # Enable TimescaleDB extension
            self.stdout.write("Enabling TimescaleDB extension...")
            cursor.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")

            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'dashboard_sensorreading'
                );
            """)
            table_exists = cursor.fetchone()[0]

            if not table_exists:
                self.stdout.write(
                    self.style.WARNING(
                        "Table dashboard_sensorreading does not exist. "
                        "Run migrations first: python manage.py migrate"
                    )
                )
                return

            # Check if already a hypertable
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM timescaledb_information.hypertables
                    WHERE hypertable_name = 'dashboard_sensorreading'
                );
            """)
            is_hypertable = cursor.fetchone()[0]

            if is_hypertable:
                self.stdout.write(
                    self.style.SUCCESS("Table is already a hypertable")
                )
            else:
                # Convert to hypertable
                self.stdout.write("Converting sensor_readings to hypertable...")
                cursor.execute("""
                    SELECT create_hypertable(
                        'dashboard_sensorreading',
                        'timestamp',
                        if_not_exists => TRUE,
                        migrate_data => TRUE
                    );
                """)
                self.stdout.write(
                    self.style.SUCCESS("Successfully converted to hypertable")
                )

            # Add compression policy (compress chunks older than 7 days)
            self.stdout.write("Setting up compression policy...")
            try:
                cursor.execute("""
                    ALTER TABLE dashboard_sensorreading SET (
                        timescaledb.compress,
                        timescaledb.compress_segmentby = 'device_id'
                    );
                """)
                cursor.execute("""
                    SELECT add_compression_policy(
                        'dashboard_sensorreading',
                        INTERVAL '7 days',
                        if_not_exists => TRUE
                    );
                """)
                self.stdout.write(
                    self.style.SUCCESS("Compression policy set (7 days)")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Compression policy skipped: {e}")
                )

            # Add retention policy (optional - delete data older than 90 days)
            self.stdout.write("Setting up retention policy...")
            try:
                cursor.execute("""
                    SELECT add_retention_policy(
                        'dashboard_sensorreading',
                        INTERVAL '90 days',
                        if_not_exists => TRUE
                    );
                """)
                self.stdout.write(
                    self.style.SUCCESS("Retention policy set (90 days)")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"Retention policy skipped: {e}")
                )

            self.stdout.write(
                self.style.SUCCESS("\nTimescaleDB setup complete!")
            )
