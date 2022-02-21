package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// SetPixels changes the color of multiple pixels at the same time
type SetPixels struct {
	Indexes []uint16
	Color   database.Color
}

func NewSetPixels(indexes []uint16, color database.Color) SetPixels {
	return SetPixels{
		Indexes: indexes,
		Color:   color,
	}
}

func (sa SetPixels) Type() string {
	return "set-arbitrary-pixels"
}

func (sa SetPixels) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Switch to queue to set all the pixels at the same time from the viewer's perspective
	queueResult, free := controller.Mode(ctx, func(params lights.LightController_mode_Params) error {
		params.SetMode(lights.Mode_queue)
		return nil
	})
	defer free()
	<-queueResult.Done()

	setResult, free := controller.Set(ctx, func(params lights.LightController_set_Params) error {
		// Set desired color
		color, err := params.NewColor()
		if err != nil {
			return err
		}
		color.SetR(sa.Color.Red)
		color.SetG(sa.Color.Green)
		color.SetB(sa.Color.Blue)

		// Set the indexes
		position, err := params.NewPosition()
		if err != nil {
			return err
		}
		list, err := position.NewList(int32(len(sa.Indexes)))
		if err != nil {
			return err
		}
		for i, v := range sa.Indexes {
			list.Set(i, v)
		}

		return nil
	})
	defer free()

	// Save the changed pixels
	if err := db.SetArbitraryPixels(sa.Indexes, sa.Color); err != nil {
		return err
	}

	// Change the display mode to individual pixels
	if err := db.SetPixelMode(database.PixelModeIndividual); err != nil {
		return err
	}

	<-setResult.Done()

	// "Commit" the changes to the strip
	showResult, free := controller.Show(ctx, func(params lights.LightController_show_Params) error {
		return nil
	})
	<-showResult.Done()

	// Switch back to instant
	instantResult, free := controller.Mode(ctx, func(params lights.LightController_mode_Params) error {
		params.SetMode(lights.Mode_instant)
		return nil
	})
	defer free()
	<-instantResult.Done()

	return nil
}
