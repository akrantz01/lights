import board
import functools
import neopixel

from lights_common import lights, SETTINGS
from .logger import get as get_logger

logger = get_logger("server")

pixels = neopixel.NeoPixel(board.D18, SETTINGS.led_count)
logger.info(f"using strip with {SETTINGS.led_count} NeoPixels")


def clamp(value: int, lower: int, upper: int):
    if value > upper:
        return upper
    elif value < lower:
        return lower
    return value


def color_to_tuple(color: lights.Color):
    color_clamp = functools.partial(clamp, lower=0, upper=255)
    r = color_clamp(color.r)
    g = color_clamp(color.g)
    b = color_clamp(color.b)
    return r, g, b


class LightControllerImpl(lights.LightController.Server):
    def set(self, position: lights.Position, color: lights.Color, **_):
        color = color_to_tuple(color)

        position_type = position.which()
        if position_type == "single":
            pixels[position.single] = color
            logger.info(f"set pixel {position.single} to {color}")
        elif position_type == "range":
            start = position.range.start
            end = position.range.end

            if start > end:
                r = range(start, end - 1, -1)
            else:
                r = range(start, end + 1)

            for p in r:
                pixels[p] = color
            logger.info(
                f"set pixels in range [{position.range.start}, {position.range.end}] to {color}"
            )
        elif position_type == "list":
            for p in position.list:
                pixels[p] = color
            logger.info(f"set pixels {position.list} to {color}")

    def fill(self, color: lights.Color, **_):
        color = color_to_tuple(color)
        pixels.fill(color)
        logger.info(f"set all pixels to {color}")

    def brightness(self, level: int, **_):
        pixels.brightness = clamp(level, 0, 100) / 100
        logger.info(f"set pixel brightness to {pixels.brightness}")

    def mode(self, mode: lights.Mode, **_):
        pixels.auto_write = mode == lights.Mode.instant
        logger.info(f"changed write mode to '{mode}'")

    def show(self, **_):
        if not pixels.auto_write:
            pixels.show()
            logger.info("wrote any queued changes to pixels")
