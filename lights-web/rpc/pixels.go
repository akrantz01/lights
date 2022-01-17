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

// SetPixelRange sets the color for a range of pixels
type SetPixelRange struct {
	Start uint16
	End   uint16
	Color database.Color
}

func NewPixelRange(start, end uint16, color database.Color) SetPixelRange {
	return SetPixelRange{
		Start: start,
		End:   end,
		Color: color,
	}
}

func (sp SetPixelRange) Type() string {
	return "set-pixel-range"
}

func (sp SetPixelRange) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	result, free := controller.Set(ctx, func(params lights.LightController_set_Params) error {
		// Set the desired color
		color, err := params.NewColor()
		if err != nil {
			return err
		}
		color.SetR(sp.Color.Red)
		color.SetG(sp.Color.Green)
		color.SetB(sp.Color.Blue)

		// Set the range
		position, err := params.NewPosition()
		if err != nil {
			return err
		}
		position.SetRange()
		position.Range().SetStart(sp.Start)
		position.Range().SetEnd(sp.End)

		return nil
	})
	defer free()

	if err := db.SetPixelRange(sp.Start, sp.End, sp.Color); err != nil {
		return err
	}

	<-result.Done()

	return nil
}

// SetArbitraryPixels changes the color of multiple pixels at the same time
type SetArbitraryPixels struct {
	Indexes []uint16
	Color   database.Color
}

func NewArbitraryPixels(indexes []uint16, color database.Color) SetArbitraryPixels {
	return SetArbitraryPixels{
		Indexes: indexes,
		Color:   color,
	}
}

func (sa SetArbitraryPixels) Type() string {
	return "set-arbitrary-pixels"
}

func (sa SetArbitraryPixels) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	result, free := controller.Set(ctx, func(params lights.LightController_set_Params) error {
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

	if err := db.SetArbitraryPixels(sa.Indexes, sa.Color); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
