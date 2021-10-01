import asyncio
from asyncio.streams import StreamReader, StreamWriter
import capnp

from .impl import LightControllerImpl
from .logger import get as get_logger

logger = get_logger("socket")


async def on_connection(reader: StreamReader, writer: StreamWriter):
    """
    Create and run a new server from a reader and writer
    """
    await Server(reader, writer).run()


# Adapted from https://github.com/capnproto/pycapnp/blob/a4ef16e8/examples/async_calculator_server.py#L16-L73
class Server(object):
    def __init__(self, reader: StreamReader, writer: StreamWriter):
        # Start the server with a two-way pipe
        self.server = capnp.TwoPartyServer(bootstrap=LightControllerImpl())
        self.reader = reader
        self.writer = writer

        self.retry = True

    async def async_reader(self):
        while self.retry:
            try:
                data = await asyncio.wait_for(self.reader.read(4096), timeout=0.1)
            except asyncio.TimeoutError:
                logger.debug("reader timeout")
                continue
            except Exception as err:
                logger.error("unknown reader error: %s", err)
                return False

            await self.server.write(data)

        logger.debug("reader complete")
        return True

    async def async_writer(self):
        while self.retry:
            try:
                data = await asyncio.wait_for(self.server.read(4096), timeout=0.1)
                self.writer.write(data.tobytes())
            except asyncio.TimeoutError:
                logger.debug("writer timeout")
                continue
            except Exception as err:
                logger.error("unknown writer error: %s", err)
                return False

        logger.debug("writer complete")
        return True

    async def run(self):
        # Assemble the reader and writer tasks to run in the background
        coroutines = [self.async_reader(), self.async_writer()]
        tasks = asyncio.gather(*coroutines, return_exceptions=True)

        while True:
            self.server.poll_once()

            # Check if the reader has been sent a disconnect (EOF)
            if self.reader.at_eof():
                self.retry = False
                break
            await asyncio.sleep(0.01)

        # Wait for reader/writer to finish to prevent possible resource leaks
        await tasks
