import board
import neopixel

from . import SETTINGS
from .logger import get as get_logger

logger = get_logger("pixels")

pixels = neopixel.NeoPixel(board.D18, SETTINGS.led_count)
logger.info(f"using strip with {SETTINGS.led_count} NeoPixels")


def clamp(value: int, lower: int, upper: int) -> int:
    if value > upper:
        return upper
    elif value < lower:
        return lower
    return value


def clamp_color(value: int) -> int:
    return clamp(value, 0, 255)


def change(index: int, r: int, g: int, b: int):
    """
    Set the color of a pixel
    :param index: the zero-based pixel index
    :param r: amount of red
    :param g: amount of green
    :param b: amount of blue
    """
    pixels[index] = (clamp_color(r), clamp_color(g), clamp_color(b))


def fill(r: int, g: int, b: int):
    """
    Set the color of the entire strip
    :param r: amount of red
    :param g: amount of green
    :param b: amount of blue
    """
    pixels.fill((clamp_color(r), clamp_color(g), clamp_color(b)))


def brightness(level: int):
    """
    Set the brightness of the entire strip
    :param level: percentage brightness
    """
    pixels.brightness = clamp(level, 0, 100) / 100


def mode(instant: bool):
    """
    Whether to write changes immediately or queue them for later
    :param instant: write changes instantly
    """
    pixels.auto_write = instant


def show():
    """
    Write any queued changes to the strip. Does nothing when in queue mode.
    """
    if not pixels.auto_write:
        pixels.show()
