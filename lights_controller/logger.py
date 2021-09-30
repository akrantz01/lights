import logging
import sys

LOG_FORMAT = logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")


def initialize():
    """
    Initialize the logging facilities
    """
    # Default to DEBUG
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    # Log to stdout at INFO
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.setFormatter(LOG_FORMAT)
    logger.addHandler(stdout_handler)

    # TODO: add debug handler


def get(name=""):
    """
    Get a named logger
    :param name: the name of the logger
    :return: a logger
    """
    return logging.getLogger(f"lights.controller{'.' + name if name else ''}")
