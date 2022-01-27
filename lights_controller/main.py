import capnp

from lights_controller import logger, SETTINGS
from lights_controller.animator import ANIMATOR
from lights_controller.impl import LightControllerImpl


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

    # Run until complete
    try:
        log.info(f"server started on {address}")
        server.run_forever()
    except KeyboardInterrupt:
        pass

    # Stop running animations
    log.info("waiting for animator to exit...")
    ANIMATOR.stop()

    log.info("server exited gracefully. good bye!")


if __name__ == "__main__":
    main()
