package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// SetPixels changes the color of multiple pixels at the same time
type SetPixels struct {
	Indexes []uint32
	Color   database.Color
}

func NewSetPixels(indexes []uint32, color database.Color) SetPixels {
	return SetPixels{
		Indexes: indexes,
		Color:   color,
	}
}

func (sa SetPixels) Type() string {
	return "set-arbitrary-pixels"
}

func (sa SetPixels) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.Set(ctx, sa.Indexes, sa.Color)

	// Save the changed pixels
	if err := db.SetArbitraryPixels(sa.Indexes, sa.Color); err != nil {
		return err
	}

	// Change the display mode to individual pixels
	if err := db.SetPixelMode(database.PixelModeIndividual); err != nil {
		return err
	}

	return nil
}
