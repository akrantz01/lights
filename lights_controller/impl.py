import board
import capnp
import functools
import neopixel

capnp.remove_import_hook()
lights = capnp.load("lights.capnp")

pixels = neopixel.NeoPixel(board.D18, 30)


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
        elif position_type == "range":
            r = position.range
            pixels[r.start : r.end + 1] = color
        elif position_type == "list":
            for p in position.list:
                pixels[p] = color

    def fill(self, color: lights.Color, **_):
        pixels.fill(color_to_tuple(color))

    def brightness(self, level: int, **_):
        pixels.brightness = clamp(level, 0, 100) / 100

    def mode(self, mode: lights.Mode, **_):
        pixels.auto_write = mode == lights.Mode.queue

    def show(self, **_):
        pixels.show()
