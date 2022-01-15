package lights

import (
	"context"
	"net"

	"capnproto.org/go/capnp/v3/rpc"
)

// Connect starts an RPC connection to the controller
func Connect(address string) (LightController, error) {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		return LightController{}, err
	}

	// Create a new RPC client
	rpcConn := rpc.NewConn(rpc.NewStreamTransport(conn), nil)
	lc := LightController{
		Client: rpcConn.Bootstrap(context.Background()),
	}

	return lc, nil
}
