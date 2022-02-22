package lights

import (
	"context"
	"net"

	"capnproto.org/go/capnp/v3/rpc"

	"github.com/akrantz01/lights/lights-web/lights/cp"
)

// Connect starts an RPC connection to the controller
// TODO: handle reconnections
func Connect(address string) (*Controller, error) {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		return nil, err
	}

	// Create a new RPC client
	rpcConn := rpc.NewConn(rpc.NewStreamTransport(conn), nil)
	lc := cp.LightController{
		Client: rpcConn.Bootstrap(context.Background()),
	}

	return &Controller{inner: lc}, nil
}
