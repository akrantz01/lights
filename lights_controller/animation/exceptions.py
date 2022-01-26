class ValidationException(Exception):
    """The animation could not be loaded"""


class MethodNotFound(ValidationException):
    """A required host method could not be found"""


class InvalidEntrypoint(ValidationException):
    """The required entrypoint could not be found"""
