from queue import Empty, SimpleQueue
from threading import Event, Thread
from typing import Optional

from . import pixels
from .animation import Animation

_queue = SimpleQueue()


class Animator(Thread):
    def __init__(self):
        super(Animator, self).__init__()
        self.daemon = False

        self.running = True
        self.stopped = Event()
        self.item: Optional[Animation] = None

    def run(self) -> None:
        while self.running:
            if self.item is None:
                # If we don't have an animation, block until we have one
                try:
                    name = _queue.get(block=False, timeout=10)
                    self.load(name)

                    # Reset the stopped state when we load a new animation
                    self.stopped.clear()
                except Empty:
                    self.stopped.set()
            else:
                try:
                    # Execute an animation frame
                    self.item.entrypoint()

                    # Attempt to fetch a newer animation w/o blocking
                    name = _queue.get(block=False)
                    self.load(name)
                except AttributeError:
                    self.stopped.set()
                except Empty:
                    pass

    @staticmethod
    def queue(name: str):
        """
        Attempt to load and queue an animation
        :param name: the animation to load
        :return: whether it could be loaded
        """
        if not Animation.exists(name):
            return False

        _queue.put(name)
        return True

    def load(self, name: str):
        """
        Load the animation from disk
        :param name: name of the module
        :return: the loaded animation
        """
        self.item = Animation.load(name)

    def pause(self):
        """
        Stop the currently running animation
        """
        self.item = None

        # Wait for the animation to stop and then switch back to instant mode
        # just in case the mode was changed in the animation
        self.stopped.wait()
        pixels.mode(True)

    def stop(self):
        """
        Stop the animator
        """
        self.running = False
        self.join()


ANIMATOR = Animator()
