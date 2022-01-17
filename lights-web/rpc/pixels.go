package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// SetSinglePixel changes the color of an individual pixel
type SetSinglePixel struct {
	Index uint16
	Color database.Color
}

func NewSetPixel(index uint16, color database.Color) SetSinglePixel {
	return SetSinglePixel{
		Index: index,
		Color: color,
	}
}

func (sp SetSinglePixel) Type() string {
	return "set-single-pixel"
}

func (sp SetSinglePixel) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Set the pixel
	result, free := controller.Set(ctx, func(params lights.LightController_set_Params) error {
		// Set the pixel color
		color, err := params.NewColor()
		if err != nil {
			return err
		}
		color.SetR(sp.Color.Red)
		color.SetG(sp.Color.Green)
		color.SetB(sp.Color.Blue)

		// Set the pixel position
		position, err := params.NewPosition()
		if err != nil {
			return err
		}
		position.SetSingle(sp.Index)

		return nil
	})
	defer free()

	// Save the color to the database
	if err := db.SetPixel(database.Pixel{
		Color: sp.Color,
		Index: sp.Index,
	}); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
