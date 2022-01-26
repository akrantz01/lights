from typing import List

from lights_capnp import lights
from . import pixels
from .animation import Animation, ValidationException
from .animator import ANIMATOR
from .logger import get as get_logger

logger = get_logger("server")


def clamp(value: int, lower: int, upper: int):
    if value > upper:
        return upper
    elif value < lower:
        return lower
    return value


class LightControllerImpl(lights.LightController.Server):
    def set(self, position: lights.Position, color: lights.Color, **_):
        position_type = position.which()
        if position_type == "single":
            pixels.change(position.single, color.r, color.g, color.b)
        elif position_type == "range":
            offset = -1 if position.range.start > position.range.end else 1
            seq = range(position.range.start, position.range.end + offset, offset)

            for p in seq:
                pixels.change(p, color.r, color.g, color.b)
        elif position_type == "list":
            for p in position.list:
                pixels.change(p, color.r, color.g, color.b)

        logger.info(f"set pixels to {(color.r, color.g, color.b)}")

    def setAll(self, colors: List[lights.Color], **_):
        for i, color in enumerate(colors):
            pixels.change(i, color.r, color.g, color.b)
        logger.info("set all pixels to specified colors")

    def fill(self, color: lights.Color, **_):
        pixels.fill(color.r, color.b, color.g)
        logger.info(f"set all pixels to {color}")

    def brightness(self, level: int, **_):
        pixels.brightness(level)
        logger.info(f"set pixel brightness to {level}")

    def mode(self, mode: lights.Mode, **_):
        pixels.mode(mode == lights.Mode.instant)
        logger.info(f"changed write mode to '{mode}'")

    def show(self, **_):
        pixels.show()
        logger.info("wrote queued changes")

    def animate(self, name: str, **_):
        try:
            animation = Animation.load(name)
            ANIMATOR.queue(animation)
            logger.info(f"started animation '{name}'")
        except FileNotFoundError:
            logger.warn(f"attempted to load nonexistent animation '{name}'")

    def stopAnimation(self, **_):
        ANIMATOR.pause()
        logger.info("stopped the current animation")

    def registerAnimation(self, name: str, animation: bytes, **_):
        try:
            compiled = Animation.build(animation)
            compiled.save(name)
            logger.info(f"loaded new animation '{name}'")
        except ValidationException as e:
            logger.warn(f"failed to load animation: {e}")

    def unregisterAnimation(self, name: str):
        Animation.remove(name)
        logger.info(f"unloaded animation: '{name}'")
