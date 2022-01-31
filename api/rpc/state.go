package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
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

func (c ChangeState) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
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
	result, free := controller.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		if c.On {
			params.SetLevel(lastBrightness)
		} else {
			params.SetLevel(0)
		}
		return nil
	})
	defer free()

	// Save the current state
	if err := db.SetState(c.On); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
