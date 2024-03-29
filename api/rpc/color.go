package rpc

import (
	"context"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/lights"
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

func (cb ChangeColor) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.Fill(ctx, cb.Color)

	// Save the color
	if err := db.SetColor(cb.Color); err != nil {
		return err
	}

	// Change the display mode to fill
	return db.SetPixelMode(database.PixelModeFill)
}
