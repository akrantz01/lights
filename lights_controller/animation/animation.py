import os
from wasmer import engine, Function, Instance, Module, Store
from wasmer_compiler_cranelift import Compiler

from .. import SETTINGS
from . import imports
from .exceptions import InvalidEntrypoint, MethodNotFound


class Animation(object):
    """
    A wrapper around a WebAssembly module to make it easier to work with
    """

    def __init__(self, store: Store, module: Module):
        self.store = store
        self.module = module
        self.environment = imports.register(self.store)

    @staticmethod
    def build(wasm: bytes) -> "Animation":
        """
        Loads an animation from bytes
        :param wasm: raw byte string
        :return: a compiled module
        """
        e = engine.Dylib(Compiler)
        store = Store(e)
        module = Module(store, wasm)
        return Animation(store, module)

    @staticmethod
    def load(name: str) -> "Animation":
        """
        Loads a pre-compiled module from disk
        :param name: name of the module
        :return: a runnable module
        """
        # Load from disk
        path = SETTINGS.animations_path.joinpath(name)
        with path.open("rb") as source:
            wasm = source.read()

        # Load the compiled wasm into a headless engine
        e = engine.Dylib()
        store = Store(e)
        module = Module.deserialize(store, wasm)

        return Animation(store, module)

    @staticmethod
    def remove(name: str):
        """
        Remove a compiled module from disk
        :param name: name of the module
        """
        path = SETTINGS.animations_path.joinpath(name)
        if path.exists():
            os.remove(str(path))

    @property
    def entrypoint(self) -> Function:
        """
        Get the animation entrypoint to be called on loop
        :return: a callable method
        """
        instance = Instance(self.module, self.environment)
        return instance.exports.animate

    def save(self, name: str):
        """
        Save a WASM module to a file
        :param name: name of the module
        """
        serialized = self.module.serialize()

        # Save to disk
        path = SETTINGS.animations_path.joinpath(name)
        with path.open("wb") as out:
            out.write(serialized)

    def validate(self):
        """
        Ensure the module is valid and is ready to execute
        :raises: ValidationException
        """
        try:
            # Create a new instance
            instance = Instance(self.module, self.environment)

            # Check the method exists and has the proper signature
            method = instance.exports.animate  # type: Function
            if len(method.type.params) != 0 or len(method.type.results) != 0:
                raise InvalidEntrypoint()
        except LookupError:
            raise InvalidEntrypoint()
        except RuntimeError:
            raise MethodNotFound()
