package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// ChangeColor changes the color of the entire strip at once
type ChangeColor struct {
	Color database.Color
}

func NewColorChange(color database.Color) ChangeColor {
	return ChangeColor{
		Color: color,
	}
}

func (cb ChangeColor) Type() string {
	return "change-color"
}

func (cb ChangeColor) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Set the fill color
	result, free := controller.Fill(ctx, func(params lights.LightController_fill_Params) error {
		color, err := params.NewColor()
		if err != nil {
			return err
		}

		color.SetR(cb.Color.Red)
		color.SetG(cb.Color.Green)
		color.SetB(cb.Color.Blue)

		return nil
	})
	defer free()

	// Save the color
	if err := db.SetColor(cb.Color); err != nil {
		return err
	}

	// Change the display mode to fill
	if err := db.SetPixelMode(database.PixelModeFill); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
