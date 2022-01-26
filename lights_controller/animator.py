from queue import Empty, SimpleQueue
from threading import Thread
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .animation import Animation

_queue = SimpleQueue()


class Animator(Thread):
    def __init__(self):
        super(Animator, self).__init__()
        self.daemon = False

        self.running = True
        self.animating = False
        self.item: Optional["Animator"] = None

    def run(self) -> None:
        while self.running:
            if self.item is None:
                # If we don't have an animation, block until we have one
                try:
                    self.item = _queue.get(block=False, timeout=10)
                except Empty:
                    pass
            else:
                try:
                    # Execute an animation frame
                    self.item.entrypoint()

                    # Attempt to fetch a newer animation w/o blocking
                    self.item = _queue.get(block=False)
                except (AttributeError, Empty):
                    pass

    @staticmethod
    def queue(animation: "Animation"):
        """
        Attempt to load and queue an animation
        :param animation: the animation to load
        """
        _queue.put(animation)

    def pause(self):
        """
        Stop the currently running animation
        """
        self.item = None

    def stop(self):
        """
        Stop the animator
        """
        self.running = False
        self.join()


ANIMATOR = Animator()
