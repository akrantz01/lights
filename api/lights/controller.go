package lights

import (
	"context"
	"net"
	"strings"
	"sync"

	"capnproto.org/go/capnp/v3/rpc"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/lights/cp"
)

const closedError = "rpc: connection closed"
const eof = "receive: EOF"

var logger = zap.L().Named("controller")

// Controller is a wrapper around a cp.LightController to make it easier to work with.
type Controller struct {
	inner cp.LightController

	address    string
	inProgress bool
	connLock   sync.Mutex
}

// connect initiates connection with the server and replaces the current inner controller
func (c *Controller) connect() error {
	// Don't run multiple connection attempts back-to-back
	if c.inProgress {
		return nil
	}

	// Ensure only 1 reconnection attempt can happen at once
	c.connLock.Lock()
	defer c.connLock.Unlock()

	c.inProgress = true
	defer func() {
		c.inProgress = false
	}()

	conn, err := net.Dial("tcp", c.address)
	if err != nil {
		return err
	}

	rpcConn := rpc.NewConn(rpc.NewStreamTransport(conn), &rpc.Options{ErrorReporter: c})
	c.inner = cp.LightController{
		Client: rpcConn.Bootstrap(context.Background()),
	}

	return nil
}

func (c *Controller) ReportError(err error) {
	// Check if the error is recoverable
	if strings.Contains(err.Error(), closedError) || strings.Contains(err.Error(), eof) {
		logger.Warn("disconnected")

		if err := c.connect(); err != nil {
			logger.Error("failed to reconnect", zap.Error(err))
		}
	} else {
		logger.Error("an error occurred in the RPC connection", zap.Error(err))
	}
}
