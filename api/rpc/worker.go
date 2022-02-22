package rpc

import (
	"context"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// Callable is used to execute Cap'n Proto RPC calls to the controller from a worker
type Callable interface {
	// Type returns a string with the action being performed
	Type() string
	// Execute runs the RPC(s) to make the desired change(s)
	Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error
}

// NewProcessor creates a new message processor for stateful RPC messages
func NewProcessor(db *database.Database, lc *lights.Controller) (chan Callable, context.CancelFunc) {
	actions := make(chan Callable, 100)

	ctx, cancel := context.WithCancel(context.Background())

	// Start the processor coroutine
	go func() {
		l := zap.L().Named("processor")
		l.Info("started action processor")

		for {
			select {
			case <-ctx.Done():
				return
			case action := <-actions:
				l.Debug("started processing", zap.String("type", action.Type()))
				if err := action.Execute(ctx, db, lc); err != nil {
					l.Error("action processing failed", zap.String("type", action.Type()), zap.Error(err))
				}
				l.Debug("processing finished", zap.String("type", action.Type()))
			}
		}
	}()

	return actions, cancel
}
