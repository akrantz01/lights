package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// ApplyPreset changes all the pixels to colors as specified by the preset
type ApplyPreset struct {
	Name string
}

func NewApplyPreset(name string) ApplyPreset {
	return ApplyPreset{
		Name: name,
	}
}

func (ap ApplyPreset) Type() string {
	return "apply-preset"
}

func (ap ApplyPreset) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Fetch the preset
	preset, err := db.GetPreset(ap.Name)
	if err == database.ErrNotFound {
		// Nothing to do if not exists
		return nil
	} else if err != nil {
		return err
	}

	// Group the colors into arbitrary sets
	colors := make(map[database.Color][]uint16)
	for i, color := range preset.Pixels {
		colors[color] = append(colors[color], uint16(i))
	}

	// Switch to queued mode
	queuedResult, free := controller.Mode(ctx, func(params lights.LightController_mode_Params) error {
		params.SetMode(lights.Mode_queue)
		return nil
	})
	<-queuedResult.Done()
	free()

	// Change all the colors
	for color, indexes := range colors {
		result, free := controller.Set(ctx, func(params lights.LightController_set_Params) error {
			c, err := params.NewColor()
			if err != nil {
				return err
			}
			c.SetR(color.Red)
			c.SetG(color.Green)
			c.SetB(color.Blue)

			// Set the indexes
			position, err := params.NewPosition()
			if err != nil {
				return err
			}
			list, err := position.NewList(int32(len(indexes)))
			if err != nil {
				return err
			}
			for i, v := range indexes {
				list.Set(i, v)
			}

			return nil
		})

		// Save changed pixels
		if err := db.SetArbitraryPixels(indexes, color); err != nil {
			return err
		}

		<-result.Done()
		free()
	}

	// Change the brightness
	brightnessChange, free := controller.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		params.SetLevel(preset.Brightness)
		return nil
	})
	<-brightnessChange.Done()
	free()

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

	return nil
}
