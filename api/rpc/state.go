package rpc

import (
	"context"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/lights"
)

// ChangeState changes whether the strip is on or off
type ChangeState struct {
	On bool
}

func NewStateChange(on bool) ChangeState {
	return ChangeState{
		On: on,
	}
}

func (c ChangeState) Type() string {
	return "change-state"
}

func (c ChangeState) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	// Get the last brightness if necessary
	var lastBrightness uint8
	if c.On {
		var err error
		lastBrightness, err = db.GetBrightness()
		if err != nil {
			return err
		}
	}

	// Set the brightness
	controller.Brightness(ctx, lastBrightness)

	// Save the current state
	return db.SetState(c.On)
}
