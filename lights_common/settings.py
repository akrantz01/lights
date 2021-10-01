from dataclasses import dataclass
from dotenv import load_dotenv
from os import environ


@dataclass
class Settings:
    # The host and port for the controller
    controller_host: str
    controller_port: int

    # The density and length of the strip
    strip_density: int
    strip_length: int

    @property
    def led_count(self):
        return self.strip_density * self.strip_length


def load() -> Settings:
    load_dotenv()
    return Settings(
        controller_host=environ.get("LIGHTS_CONTROLLER_HOST", "127.0.0.1"),
        controller_port=int(environ.get("LIGHTS_CONTROLLER_PORT", 30000)),
        strip_density=int(environ.get("LIGHTS_STRIP_DENSITY", 30)),
        strip_length=int(environ.get("LIGHTS_STRIP_LENGTH", 5)),
    )
