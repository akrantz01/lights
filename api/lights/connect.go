package lights

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/akrantz01/lights/lights-web/lights/pb"
)

// Controller is a wrapper around a pb.ControllerClient to make it easier to work with.
type Controller struct {
	conn  *grpc.ClientConn
	inner pb.ControllerClient
}

// Connect starts an RPC connection to the controller
func Connect(address string) (*Controller, error) {
	conn, err := grpc.Dial(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Controller{
		conn:  conn,
		inner: pb.NewControllerClient(conn),
	}, nil
}

// Close disconnects from the server
func (c *Controller) Close() error {
	return c.conn.Close()
}
