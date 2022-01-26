from wasmer import Function, FunctionType, ImportObject, Store, Type

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
            "brightness": Function(
                store, pixels.brightness, FunctionType(params=[Type.I32], results=[])
            ),
            "fill": Function(
                store,
                pixels.fill,
                FunctionType(params=[Type.I32, Type.I32, Type.I32], results=[]),
            ),
            "instant_mode": Function(
                store, lambda: pixels.mode(True), FunctionType(params=[], results=[])
            ),
            "queue_mode": Function(
                store, lambda: pixels.mode(False), FunctionType(params=[], results=[])
            ),
            "set": Function(
                store,
                pixels.change,
                FunctionType(
                    params=[Type.I32, Type.I32, Type.I32, Type.I32], results=[]
                ),
            ),
            "show": Function(store, pixels.show, FunctionType(params=[], results=[])),
        },
    )
    return imports
