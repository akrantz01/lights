import asyncio
from asyncio.streams import StreamReader, StreamWriter
import socket
from typing import List, Tuple

import capnp

from lights_common import lights, SETTINGS


class Client(object):
    def __init__(self):
        self.client: lights.LightController = capnp.TwoPartyClient()

    async def connect(self):
        """
        Connect to a light controller server.
        """

        # Connect to the controller
        reader, writer = await asyncio.open_connection(
            SETTINGS.controller_host, SETTINGS.controller_port, family=socket.AF_INET
        )

        # Spawn the reader and writer tasks
        coroutines = [self.read(reader, self.client), self.write(writer, self.client)]
        asyncio.gather(*coroutines, return_exceptions=True)

        self.client = self.client.bootstrap().cast_as(lights.LightController)

    @staticmethod
    async def read(reader: StreamReader, client):
        while True:
            data = await reader.read(4096)
            client.write(data)

    @staticmethod
    async def write(writer: StreamWriter, client):
        while True:
            data = await client.read(4096)
            writer.write(data.tobytes())
            await writer.drain()

    async def fill(self, color: Tuple[int, int, int]):
        """
        Set all the lights to a single color
        :param color: a RGB tuple
        """
        r, g, b = color
        await self.client.fill({"r": r, "g": g, "b": b}).a_wait()

    async def brightness(self, b: int):
        """
        Set the brightness of the entire strip
        :param b: the percent as an integer from 0 to 100
        """
        await self.client.brightness(b).a_wait()

    async def queue_mode(self):
        """
        Set the LED strip to queue any writes
        """
        await self.client.mode("queue").a_wait()

    async def instant_mode(self):
        """
        Set the LED strip to instantly write any changes
        """
        await self.client.mode("instant").a_wait()

    async def show(self):
        """
        Write any queued changes to the strip. This does nothing when the
        strip is in instant mode.
        """
        await self.client.show().a_wait()

    async def set_range(self, color: Tuple[int, int, int], start: int, end: int):
        """
        Set a range of LEDs to the given color
        :param color: a RGB tuple
        :param start: 0-indexed start position
        :param end: 0-indexed end position
        """
        r, g, b = color
        await self.client.set(
            {"range": {"start": start, "end": end}}, {"r": r, "g": g, "b": b}
        ).a_wait()

    async def set(self, color: Tuple[int, int, int], position: int):
        """
        Set an individual LED to the given color
        :param color: a RGB tuple
        :param position: 0-indexed position
        """
        r, g, b = color
        await self.client.set({"single": position}, {"r": r, "g": g, "b": b}).a_wait()

    async def set_list(self, color: Tuple[int, int, int], positions: List[int]):
        """
        Set a list of LEDs to the given color
        :param color: a RGB tuple
        :param positions: 0-indexed list of positions
        """
        r, g, b = color
        await self.client.set({"list": positions}, {"r": r, "g": g, "b": b}).a_wait()


CLIENT = Client()


def with_client() -> Client:
    """
    Get a reference to the client
    """
    return CLIENT
