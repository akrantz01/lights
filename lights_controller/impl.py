import capnp

capnp.remove_import_hook()
lights = capnp.load("lights.capnp")


class LightControllerImpl(lights.LightController.Server):
    pass
