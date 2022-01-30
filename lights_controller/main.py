import capnp
import signal
import sys
from typing import Any, Optional

from lights_controller import logger, SETTINGS
from lights_controller.animator import ANIMATOR
from lights_controller.impl import LightControllerImpl


def terminate_handler(_signal: Optional[int] = None, _frame: Optional[Any] = None):
    """
    Handle shutting down the server
    :param _signal:
    :param _frame:
    """
    log = logger.get()

    # Stop running animations
    log.info("waiting for animator to exit...")
    ANIMATOR.stop()

    log.info("server exited gracefully. good bye!")

    sys.exit(0)


def main():
    log = logger.get()
    log.info("starting controller")

    # Launch the animation controller
    ANIMATOR.start()

    # Ensure directory exists prior to running
    if not SETTINGS.animations_path.exists():
        SETTINGS.animations_path.mkdir(parents=True, exist_ok=True)

    # Initialize the server
    address = f"{SETTINGS.controller_host}:{SETTINGS.controller_port}"
    server = capnp.TwoPartyServer(socket=address, bootstrap=LightControllerImpl())

    # Register signal handlers
    signal.signal(signal.SIGTERM, terminate_handler)
    signal.signal(signal.SIGINT, terminate_handler)
    signal.signal(signal.SIGQUIT, terminate_handler)

    # Run until complete
    try:
        log.info(f"server started on {address}")
        server.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        terminate_handler()


if __name__ == "__main__":
    main()
