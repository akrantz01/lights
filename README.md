# Lights

Lights allows you to control an Adafruit NeoPixel light strip using a web interface on a Raspberry Pi. Authentication
provided by [Auth0](https://www.auth0.com) prevents unauthorized users from messing with your lights. The frontend acts
as a real-time interface synchronized between all connected clients, reducing the possibility of stale data.

Lights is currently controlling a strip in my dorm room. You can see what my lights are doing at
[https://lights.krantz.dev](https://lights.krantz.dev).


### Features

- Change the brightness, on/off state, and color of the entire strip
- Set the color of individual LEDs
- Create preset displays of LEDs
- Automatically change the lights using schedules
- Run custom animations compiled to [WebAssembly](https://webassembly.org/) (ex [rainbow](sample-animations/rainbow))
- Assign permissions to users


## Architecture

To control the lights, there are 3 primary components: the frontend, the API, and the controller. The frontend, built 
using React, provides a friendly user interface for viewing and controlling. The API, written in Golang, bridges the 
controller and frontend to provide higher level control over the strip such as presets and schedules. Finally, the 
controller, written in Python, does the interfacing with the light strip itself through a handful of basic primitives.

The API and frontend communicate via a REST API and WebSocket API. The REST API is used for CRUD operations on
animations, presets, and schedules which are all stored in the database. The WebSocket API is used for providing real-time
status updates and control over the strip. There is also a server-sent events route for providing real-time updates to
the REST resources.

The API and controller communicate via a [Cap'n Proto](https://capnproto.org) RPC interface as defined in 
[lights.capnp](lights_capnp/lights.capnp). For similar systems, the separation between API and controller would not be
necessary. However, as the [NeoPixel library](https://pypi.org/project/adafruit-circuitpython-neopixel/) only runs on
the Raspberry Pi, this makes it possible to develop on any system that is on the same network as the Pi.


## Roadmap

Some features I would like to add in the future:

- animations editable in the web UI
- a mobile app


### Contributing

If you would like to contribute to fix a bug or add a feature, feel free to make a PR!
