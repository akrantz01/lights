package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// ApplyPreset changes all the pixels to colors as specified by the preset
type ApplyPreset struct {
	Brightness uint8
	Pixels     []database.Color
}

func NewApplyPreset(preset database.Preset) ApplyPreset {
	return ApplyPreset{
		Brightness: preset.Brightness,
		Pixels:     preset.Pixels,
	}
}

func (ap ApplyPreset) Type() string {
	return "apply-preset"
}

func (ap ApplyPreset) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Switch to queued mode
	queuedResult, free := controller.Mode(ctx, func(params lights.LightController_mode_Params) error {
		params.SetMode(lights.Mode_queue)
		return nil
	})
	<-queuedResult.Done()
	free()

	// Set all the pixels
	setAllResult, free := controller.SetAll(ctx, func(params lights.LightController_setAll_Params) error {
		// Create the new list
		list, err := params.NewColors(int32(len(ap.Pixels)))
		if err != nil {
			return err
		}

		// Fill the list
		for i, color := range ap.Pixels {
			c, err := lights.NewColor(list.Segment())
			if err != nil {
				return err
			}
			c.SetR(color.Red)
			c.SetG(color.Green)
			c.SetB(color.Blue)

			if err := list.Set(i, c); err != nil {
				return err
			}
		}

		return nil
	})
	<-setAllResult.Done()
	free()

	// Save the pixel changes
	if err := db.SetAllPixels(ap.Pixels); err != nil {
		return err
	}
	if err := db.SetPixelMode(database.PixelModeIndividual); err != nil {
		return err
	}

	// Change the brightness
	brightnessChange, free := controller.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		params.SetLevel(ap.Brightness)
		return nil
	})
	<-brightnessChange.Done()
	free()

	// Save the brightness change
	if err := db.SetBrightness(ap.Brightness); err != nil {
		return err
	}

	// Propagate the changes
	showResult, free := controller.Show(ctx, func(params lights.LightController_show_Params) error {
		return nil
	})
	<-showResult.Done()
	free()

	// Switch back to instant mode
	instantResult, free := controller.Mode(ctx, func(params lights.LightController_mode_Params) error {
		params.SetMode(lights.Mode_instant)
		return nil
	})
	<-instantResult.Done()
	free()

	// Mark the strip as being on
	if err := db.SetState(true); err != nil {
		return err
	}

	return nil
}
