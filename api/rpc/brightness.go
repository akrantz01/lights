package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
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

func (cb ChangeBrightness) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Set the brightness
	result, free := controller.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		params.SetLevel(cb.Brightness)
		return nil
	})
	defer free()

	// Save the change
	if err := db.SetBrightness(cb.Brightness); err != nil {
		return err
	}

	// Mark the strip as on if the brightness is non-zero
	if err := db.SetState(cb.Brightness != 0); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
