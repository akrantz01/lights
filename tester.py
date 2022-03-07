import click
import grpc
from tester_pb2 import (
    BrightnessArgs,
    Color,
    Empty,
    RegisterAnimationArgs,
    SetAllArgs,
    SetArgs,
    StartAnimationArgs,
    UnregisterAnimationArgs,
)
from tester_pb2_grpc import ControllerStub
import typing as t

from lights_controller import SETTINGS


class MutuallyExclusiveOption(click.Option):
    def __init__(self, *args, **kwargs):
        self.mutually_exclusive = set(kwargs.pop("mutex_args", []))
        self.prefix = kwargs.pop("mutex_prefix", "")
        help_str = kwargs.get("help", "")

        if self.mutually_exclusive:
            kwargs["help"] = (
                help_str
                + f" NOTE: This argument is mutually exclusive with arguments: [{self.formatted}]"
            )

        super(MutuallyExclusiveOption, self).__init__(*args, **kwargs)

    @property
    def formatted(self) -> str:
        prefix_len = len(self.prefix)
        return ", ".join(map(lambda s: s[prefix_len:], self.mutually_exclusive))

    @property
    def extended_formatted(self) -> str:
        return self.formatted + ", " + self.name[len(self.prefix) :]

    def handle_parse_result(
        self, ctx: click.Context, opts: t.Mapping[str, t.Any], args: t.List[str]
    ) -> t.Tuple[t.Any, t.List[str]]:
        intersection = self.mutually_exclusive.intersection(opts)

        if not intersection and self.name not in opts:
            raise click.UsageError(f"One of `{self.extended_formatted}` is required.")

        if intersection and self.name in opts:
            raise click.BadParameter(
                f"Only one of `{self.extended_formatted}` can be used at a time."
            )

        return super(MutuallyExclusiveOption, self).handle_parse_result(ctx, opts, args)


def validate_range(_ctx, _param, value):
    if value is None:
        return value
    elif isinstance(value, dict):
        if "start" in value and "end" in value:
            return value

    try:
        [start, end] = value.split(",")
        return {"start": int(start), "end": int(end)}
    except ValueError:
        raise click.BadParameter("format must be 'start,end'")


def validate_color(ctx, param, value):
    if value is None:
        return value
    elif isinstance(value, dict):
        if "r" in value and "g" in value and "b" in value:
            return Color(r=value["r"], g=value["g"], b=value["b"])
    elif isinstance(value, tuple):
        return [validate_color(ctx, param, c) for c in value]

    try:
        [r, g, b] = value.split(",")
        return Color(r=int(r), g=int(g), b=int(b))
    except ValueError:
        raise click.BadParameter("format must be 'r,g,b'")


@click.group()
@click.option(
    "-a",
    "--address",
    "address",
    type=str,
    help="The address of the server to connect to",
    default=SETTINGS.controller_host,
)
@click.option(
    "-p",
    "--port",
    "port",
    type=int,
    help="The port of the server to connect to",
    default=SETTINGS.controller_port,
)
@click.pass_context
def main(ctx: click.Context, address: str, port: int):
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())
    else:
        channel = grpc.insecure_channel(f"{address}:{port}")
        ctx.obj = ControllerStub(channel)


@main.command(
    help="Set the color of one or many pixels. The color must be in the format 'r,g,b'."
)
@click.argument(
    "color",
    required=True,
    callback=validate_color,
)
@click.option(
    "-s",
    "--single",
    "position_single",
    help="The single position at which to set the color",
    default=None,
    type=int,
    cls=MutuallyExclusiveOption,
    mutex_args=["position_range", "position_list"],
    mutex_prefix="position_",
)
@click.option(
    "-r",
    "--range",
    "position_range",
    help="The range of positions to set the color. Must be in the format `start,end`.",
    default=None,
    type=str,
    cls=MutuallyExclusiveOption,
    mutex_args=["position_single", "position_list"],
    mutex_prefix="position_",
    callback=validate_range,
)
@click.option(
    "-l",
    "--list",
    "position_list",
    help="The list of positions to set the color. To pass multiple positions, add multiple of the flag.",
    default=None,
    type=int,
    multiple=True,
    cls=MutuallyExclusiveOption,
    mutex_args=["position_range", "position_single"],
    mutex_prefix="position_",
)
@click.pass_obj
def set(
    obj: ControllerStub,
    color: Color,
    position_single: t.Optional[int],
    position_range: t.Optional[t.Dict[str, int]],
    position_list: t.Optional[t.List[int]],
):
    if position_single is not None:
        indexes = [position_single]
    elif position_range is not None:
        indexes = list(range(position_range["start"], position_range["end"]))
    else:
        indexes = position_list

    obj.Set(SetArgs(indexes=indexes, color=color))


@main.command(
    name="set-all",
    help="Set the colors of all the pixels. The color must be in the format 'r,g,b'.",
)
@click.argument(
    "colors",
    required=True,
    callback=validate_color,
    nargs=-1,
)
@click.pass_obj
def set_all(obj: ControllerStub, colors: t.List[Color]):
    obj.SetAll(SetAllArgs(colors=colors))


@main.command(
    help="Fill the entire strip with a single color. The color must be in the format 'r,g,b'."
)
@click.argument(
    "color",
    required=True,
    callback=validate_color,
)
@click.pass_obj
def fill(obj: ControllerStub, color: Color):
    obj.Fill(color)


@main.command(
    help="Set the brightness of the strip. Only values 0-100 inclusive are accepted."
)
@click.argument("level", required=True, type=click.IntRange(0, 100, clamp=True))
@click.pass_obj
def brightness(obj: ControllerStub, level: int):
    obj.Brightness(BrightnessArgs(brightness=level))


@main.group(help="Manage strip animations")
def animations():
    pass


@animations.command(help="Start an animation")
@click.argument("name", required=True)
@click.pass_obj
def start(obj: ControllerStub, name: str):
    obj.StartAnimation(StartAnimationArgs(id=name))


@animations.command(help="Stop the currently running animation")
@click.pass_obj
def stop(obj: ControllerStub):
    obj.StopAnimation(Empty())


@animations.command(help="Register a new animation")
@click.argument("name", required=True)
@click.argument("wasm", required=True, type=click.File("rb"))
@click.pass_obj
def register(obj: ControllerStub, name: str, wasm: t.BinaryIO):
    result = obj.RegisterAnimation(RegisterAnimationArgs(id=name, wasm=wasm.read()))
    if not result.success:
        click.echo("Registration unsuccessful")


@animations.command(help="Unregister an animation")
@click.argument("name", required=True)
@click.pass_obj
def unregister(obj: ControllerStub, name: str):
    obj.UnregisterAnimation(UnregisterAnimationArgs(id=name))


if __name__ == "__main__":
    main()
