import logging

from . import SETTINGS

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    level=SETTINGS.log_level,
)


def get(name=""):
    """
    Get a named logger
    :param name: the name of the logger
    :return: a logger
    """
    return logging.getLogger(f"lights.controller{'.' + name if name else ''}")
