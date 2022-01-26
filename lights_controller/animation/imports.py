from wasmer import Function, ImportObject, Store

from .. import pixels


def register(store: Store) -> ImportObject:
    """
    Register all the host methods for changing pixels
    :param store: the store to register methods to
    :return: the import environment
    """
    imports = ImportObject()
    imports.register(
        "env",
        {
            "brightness": Function(store, pixels.brightness),
            "fill": Function(store, pixels.fill),
            "mode": Function(store, pixels.mode),
            "set": Function(store, pixels.change),
            "show": Function(store, pixels.show),
        },
    )
    return imports
