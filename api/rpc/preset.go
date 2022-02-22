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

func (ap ApplyPreset) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	// Switch to queued mode
	controller.Queue(ctx)

	// Set all the pixels
	controller.SetAll(ctx, ap.Pixels)

	// Save the pixel changes
	if err := db.SetAllPixels(ap.Pixels); err != nil {
		return err
	}
	if err := db.SetPixelMode(database.PixelModeIndividual); err != nil {
		return err
	}

	// Change the brightness
	controller.Brightness(ctx, ap.Brightness)

	// Save the brightness change
	if err := db.SetBrightness(ap.Brightness); err != nil {
		return err
	}

	// Propagate the changes
	controller.Show(ctx)

	// Switch back to instant mode
	controller.Instant(ctx)

	// Mark the strip as being on
	if err := db.SetState(true); err != nil {
		return err
	}

	return nil
}
