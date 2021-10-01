import capnp
import click
import typing as t

capnp.remove_import_hook()
lights = capnp.load("lights_common/lights.capnp")


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


def validate_color(_ctx, _param, value):
    if value is None:
        return value
    elif isinstance(value, dict):
        if "r" in value and "g" in value and "b" in value:
            return value

    try:
        [r, g, b] = value.split(",")
        return {"r": int(r), "g": int(g), "b": int(b)}
    except ValueError:
        raise click.BadParameter("format must be 'r,g,b'")


@click.group()
@click.option(
    "-a",
    "--address",
    "address",
    type=str,
    help="The address of the server to connect to",
    default="127.0.0.1",
)
@click.option(
    "-p",
    "--port",
    "port",
    type=int,
    help="The port of the server to connect to",
    default=8080,
)
@click.pass_context
def main(ctx: click.Context, address: str, port: int):
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())
    else:
        client = capnp.TwoPartyClient(f"{address}:{port}")
        ctx.obj = client.bootstrap().cast_as(lights.LightController)


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
    obj: lights.LightController,
    color: t.Dict[str, int],
    position_single: t.Optional[int],
    position_range: t.Optional[t.Dict[str, int]],
    position_list: t.Optional[t.List[int]],
):
    position = {}
    if position_single is not None:
        position["single"] = position_single
    elif position_range is not None:
        position["range"] = position_range
    else:
        position["list"] = position_list

    obj.set(position, color).wait()


@main.command(
    help="Fill the entire strip with a single color. The color must be in the format 'r,g,b'."
)
@click.argument(
    "color",
    required=True,
    callback=validate_color,
)
@click.pass_obj
def fill(obj: lights.LightController, color: t.Dict[str, int]):
    obj.fill(color).wait()


@main.command(
    help="Set the brightness of the strip. Only values 0-100 inclusive are accepted."
)
@click.argument("level", required=True, type=click.IntRange(0, 100, clamp=True))
@click.pass_obj
def brightness(obj: lights.LightController, level: int):
    obj.brightness(level).wait()


@main.command(
    name="mode",
    help="Set the display mode of the strip. 'instant' will immediately propagate any changes, where as 'queue' will "
    "require a separate command to display the changes.",
)
@click.argument("mode", type=click.Choice(["instant", "queue"], case_sensitive=False))
@click.pass_obj
def set_mode(obj: lights.LightController, mode: str):
    obj.mode(mode.lower()).wait()


@main.command(help="Write any queued changes to the strip.")
@click.pass_obj
def show(obj: lights.LightController):
    obj.show().wait()


if __name__ == "__main__":
    main()
