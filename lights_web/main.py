from alembic.config import CommandLine
import click
from gunicorn.app.base import BaseApplication
from typing import Optional

from lights_web import app


class Application(BaseApplication):
    def __init__(self, bind: Optional[str] = None, workers: Optional[int] = None):
        self.bind = bind or "127.0.0.1:8000"
        self.workers = workers or 2
        super().__init__()

    # Unused, need to implement for abstract class
    def init(self, parser, opts, args):
        pass

    def load_config(self):
        self.cfg.set("bind", [self.bind])
        self.cfg.set("workers", self.workers)
        self.cfg.set("worker_class", "uvicorn.workers.UvicornWorker")

    def load(self):
        return app.app


@click.group(
    invoke_without_command=True,
    context_settings={"help_option_names": ["-h", "--help"]},
)
@click.pass_context
def main(ctx: click.Context):
    """

    \f
    :param ctx: the Click command context
    """
    # Start the server when no subcommand is used
    if ctx.invoked_subcommand is None:
        ctx.invoke(start)


@main.command()
@click.option("-b", "--bind", help="The address to listen on", required=False)
@click.option(
    "-w", "--workers", type=int, help="The number of workers to spawn", required=False
)
def start(bind: Optional[str], workers: Optional[str]):
    """
    Start the server

    If no options are specified, configuration will be loaded from the environment.
    A .env file can be used as well.

    \f
    :param ctx: the Click command context
    :param bind: the address to bind to
    :param workers: the number of gunicorn workers to spawn
    """
    Application(bind=bind, workers=workers).run()


@main.command(
    context_settings={
        "ignore_unknown_options": True,
        "allow_extra_args": True,
        "help_option_names": [],
    }
)
@click.pass_context
def migrations(ctx: click.Context):
    """
    Manage migrations with alembic

    \f
    :param ctx: the Click command context
    """
    CommandLine(prog="lights-web migrations").main(argv=ctx.args)


if __name__ == "__main__":
    main()
