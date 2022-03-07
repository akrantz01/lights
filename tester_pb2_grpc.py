# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import tester_pb2 as lights__pb2


class ControllerStub(object):
    """Controls an individual strip of NeoPixels"""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.Set = channel.unary_unary(
            "/lights.Controller/Set",
            request_serializer=lights__pb2.SetArgs.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.SetAll = channel.unary_unary(
            "/lights.Controller/SetAll",
            request_serializer=lights__pb2.SetAllArgs.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.Fill = channel.unary_unary(
            "/lights.Controller/Fill",
            request_serializer=lights__pb2.Color.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.Brightness = channel.unary_unary(
            "/lights.Controller/Brightness",
            request_serializer=lights__pb2.BrightnessArgs.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.StartAnimation = channel.unary_unary(
            "/lights.Controller/StartAnimation",
            request_serializer=lights__pb2.StartAnimationArgs.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.StopAnimation = channel.unary_unary(
            "/lights.Controller/StopAnimation",
            request_serializer=lights__pb2.Empty.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )
        self.RegisterAnimation = channel.unary_unary(
            "/lights.Controller/RegisterAnimation",
            request_serializer=lights__pb2.RegisterAnimationArgs.SerializeToString,
            response_deserializer=lights__pb2.AnimationStatus.FromString,
        )
        self.UnregisterAnimation = channel.unary_unary(
            "/lights.Controller/UnregisterAnimation",
            request_serializer=lights__pb2.UnregisterAnimationArgs.SerializeToString,
            response_deserializer=lights__pb2.Empty.FromString,
        )


class ControllerServicer(object):
    """Controls an individual strip of NeoPixels"""

    def Set(self, request, context):
        """Set the color of a set of pixels"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def SetAll(self, request, context):
        """Set the color of all pixels at the same time"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def Fill(self, request, context):
        """Fill the entire strip with the given color"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def Brightness(self, request, context):
        """Set the brightness of the strip. Only values 0-100 inclusive are accepted"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def StartAnimation(self, request, context):
        """Run the specified animation by id. Once started, no other actions can be performed until stopped."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def StopAnimation(self, request, context):
        """Stop the currently running animation. This method is idempotent."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def RegisterAnimation(self, request, context):
        """Register an animation with an associated id"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")

    def UnregisterAnimation(self, request, context):
        """Remove an animation from the registry by id"""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details("Method not implemented!")
        raise NotImplementedError("Method not implemented!")


def add_ControllerServicer_to_server(servicer, server):
    rpc_method_handlers = {
        "Set": grpc.unary_unary_rpc_method_handler(
            servicer.Set,
            request_deserializer=lights__pb2.SetArgs.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "SetAll": grpc.unary_unary_rpc_method_handler(
            servicer.SetAll,
            request_deserializer=lights__pb2.SetAllArgs.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "Fill": grpc.unary_unary_rpc_method_handler(
            servicer.Fill,
            request_deserializer=lights__pb2.Color.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "Brightness": grpc.unary_unary_rpc_method_handler(
            servicer.Brightness,
            request_deserializer=lights__pb2.BrightnessArgs.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "StartAnimation": grpc.unary_unary_rpc_method_handler(
            servicer.StartAnimation,
            request_deserializer=lights__pb2.StartAnimationArgs.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "StopAnimation": grpc.unary_unary_rpc_method_handler(
            servicer.StopAnimation,
            request_deserializer=lights__pb2.Empty.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
        "RegisterAnimation": grpc.unary_unary_rpc_method_handler(
            servicer.RegisterAnimation,
            request_deserializer=lights__pb2.RegisterAnimationArgs.FromString,
            response_serializer=lights__pb2.AnimationStatus.SerializeToString,
        ),
        "UnregisterAnimation": grpc.unary_unary_rpc_method_handler(
            servicer.UnregisterAnimation,
            request_deserializer=lights__pb2.UnregisterAnimationArgs.FromString,
            response_serializer=lights__pb2.Empty.SerializeToString,
        ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
        "lights.Controller", rpc_method_handlers
    )
    server.add_generic_rpc_handlers((generic_handler,))


# This class is part of an EXPERIMENTAL API.
class Controller(object):
    """Controls an individual strip of NeoPixels"""

    @staticmethod
    def Set(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/Set",
            lights__pb2.SetArgs.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def SetAll(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/SetAll",
            lights__pb2.SetAllArgs.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def Fill(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/Fill",
            lights__pb2.Color.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def Brightness(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/Brightness",
            lights__pb2.BrightnessArgs.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def StartAnimation(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/StartAnimation",
            lights__pb2.StartAnimationArgs.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def StopAnimation(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/StopAnimation",
            lights__pb2.Empty.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def RegisterAnimation(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/RegisterAnimation",
            lights__pb2.RegisterAnimationArgs.SerializeToString,
            lights__pb2.AnimationStatus.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )

    @staticmethod
    def UnregisterAnimation(
        request,
        target,
        options=(),
        channel_credentials=None,
        call_credentials=None,
        insecure=False,
        compression=None,
        wait_for_ready=None,
        timeout=None,
        metadata=None,
    ):
        return grpc.experimental.unary_unary(
            request,
            target,
            "/lights.Controller/UnregisterAnimation",
            lights__pb2.UnregisterAnimationArgs.SerializeToString,
            lights__pb2.Empty.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
        )