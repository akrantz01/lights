import capnp
import os.path
import sys

capnp.remove_import_hook()

# Find the Cap'n Proto definition
for path in sys.path:
    try:
        lights = capnp.load(os.path.sep.join([path, __package__, "lights.capnp"]))
    except OSError:
        continue

# Check that it was loaded successfully
try:
    lights
except NameError as e:
    raise e
