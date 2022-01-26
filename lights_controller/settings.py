from dataclasses import dataclass
from dotenv import load_dotenv
import logging
from os import environ
from pathlib import Path


@dataclass
class Settings:
    # The host and port for the controller
    controller_host: str
    controller_port: int

    # Where to store/load registered animations
    animations_path: Path

    # The log level to report at
    log_level: int

    # The density and length of the strip
    strip_density: int
    strip_length: int

    # Whether to run in development mode
    development: bool

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

    raw_development = environ.get("LIGHTS_DEVELOPMENT", "no").lower()
    development = (
        raw_development == "yes"
        or raw_development == "y"
        or raw_development == "true"
        or raw_development == "t"
    )

    return Settings(
        controller_host=environ.get("LIGHTS_CONTROLLER_HOST", "127.0.0.1"),
        controller_port=int(environ.get("LIGHTS_CONTROLLER_PORT", 30000)),
        animations_path=Path(
            environ.get("LIGHTS_CONTROLLER_ANIMATIONS_PATH", "./animations")
        ).absolute(),
        strip_density=int(environ.get("LIGHTS_STRIP_DENSITY", 30)),
        strip_length=int(environ.get("LIGHTS_STRIP_LENGTH", 5)),
        log_level=level,
        development=development,
    )
