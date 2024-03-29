package rpc

import (
	"context"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/lights"
)

// ChangeBrightness changes the entire brightness of the strip
type ChangeBrightness struct {
	Brightness uint8
}

func NewBrightnessChange(brightness uint8) ChangeBrightness {
	return ChangeBrightness{
		Brightness: brightness,
	}
}

func (cb ChangeBrightness) Type() string {
	return "change-brightness"
}

func (cb ChangeBrightness) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.Brightness(ctx, cb.Brightness)

	// Save the change
	if err := db.SetBrightness(cb.Brightness); err != nil {
		return err
	}

	// Mark the strip as on if the brightness is non-zero
	return db.SetState(cb.Brightness != 0)
}
