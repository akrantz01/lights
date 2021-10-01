import asyncio
import signal
import socket

from lights_common import SETTINGS
from lights_controller import logger
from lights_controller.server import on_connection


def cancel_tasks(loop: asyncio.AbstractEventLoop):
    # Get all the tasks
    tasks = {t for t in asyncio.all_tasks(loop=loop) if not t.done()}

    if not tasks:
        return

    # Cancel the tasks
    for task in tasks:
        task.cancel()

    # Wait until tasks are completed
    loop.run_until_complete(asyncio.gather(*tasks, return_exceptions=True))

    # Ensure all tasks canceled gracefully
    for task in tasks:
        if task.cancelled():
            continue
        if task.exception() is not None:
            loop.call_exception_handler(
                {
                    "message": "Unhandled exception during shutdown",
                    "exception": task.exception(),
                    "task": task,
                }
            )


async def start_listener():
    listener = await asyncio.start_server(
        on_connection,
        SETTINGS.controller_host,
        str(SETTINGS.controller_port),
        family=socket.AF_INET,
    )

    async with listener:
        await listener.serve_forever()


def main():
    loop = asyncio.get_event_loop()
    log = logger.get()

    log.info("starting controller")

    # Completion callback
    def stop_loop_on_completion(_):
        loop.stop()

    # Attempt to register signal handlers
    try:
        loop.add_signal_handler(signal.SIGINT, lambda: loop.stop())
        loop.add_signal_handler(signal.SIGTERM, lambda: loop.stop())
    except NotImplemented:
        pass

    # Start the server
    future = asyncio.ensure_future(start_listener(), loop=loop)
    future.add_done_callback(stop_loop_on_completion)

    # Run until complete
    try:
        log.info(
            f"server started on {SETTINGS.controller_host}:{SETTINGS.controller_port}"
        )
        loop.run_forever()
    except KeyboardInterrupt:
        log.info("received termination signal")
    finally:
        future.remove_done_callback(stop_loop_on_completion)
        log.info("cleaning up tasks")
        cancel_tasks(loop)

    log.info("server exited gracefully. good bye!")

    # Shutdown the event loop and cleanup tasks
    try:
        cancel_tasks(loop)

        # Stop async generators
        loop.run_until_complete(loop.shutdown_asyncgens())
    finally:
        loop.close()


if __name__ == "__main__":
    main()
