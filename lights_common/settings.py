from dataclasses import dataclass
from dotenv import load_dotenv
import logging
from os import environ


@dataclass
class Settings:
    # The host and port for the controller
    controller_host: str
    controller_port: int

    # The log level to report at
    log_level: int

    # The density and length of the strip
    strip_density: int
    strip_length: int

    # The URL of the database to connect to
    database_url: str

    @property
    def led_count(self):
        return self.strip_density * self.strip_length


def load() -> Settings:
    load_dotenv()

    raw_level = environ.get("LIGHTS_LOG_LEVEL", logging.INFO)
    try:
        level = int(raw_level)
    except ValueError:
        level = logging.getLevelName(raw_level)

    raw_database_url = environ.get(
        "LIGHTS_DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/postgres",
    )
    database_url = raw_database_url.replace(
        "postgresql://", "postgresql+asyncpg://"
    ).replace("postgres://", "postgresql+asyncpg://")

    return Settings(
        controller_host=environ.get("LIGHTS_CONTROLLER_HOST", "127.0.0.1"),
        controller_port=int(environ.get("LIGHTS_CONTROLLER_PORT", 30000)),
        strip_density=int(environ.get("LIGHTS_STRIP_DENSITY", 30)),
        strip_length=int(environ.get("LIGHTS_STRIP_LENGTH", 5)),
        database_url=database_url,
        log_level=level,
    )
