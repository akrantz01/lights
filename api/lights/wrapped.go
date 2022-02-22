package lights

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights/cp"
)

// Set changes the color of pixels at the given indexes
func (c *Controller) Set(ctx context.Context, indexes []uint16, color database.Color) {
	result, free := c.inner.Set(ctx, func(params cp.LightController_set_Params) error {
		// Set the color
		messageColor, err := params.NewColor()
		if err != nil {
			return err
		}
		messageColor.SetR(color.Red)
		messageColor.SetG(color.Green)
		messageColor.SetB(color.Blue)

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
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// Fill changes the color of the entire strip
func (c *Controller) Fill(ctx context.Context, color database.Color) {
	result, free := c.inner.Fill(ctx, func(params cp.LightController_fill_Params) error {
		messageColor, err := params.NewColor()
		if err != nil {
			return err
		}
		messageColor.SetR(color.Red)
		messageColor.SetG(color.Green)
		messageColor.SetB(color.Blue)

		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// Brightness sets the brightness of the entire strip
func (c *Controller) Brightness(ctx context.Context, brightness uint8) {
	result, free := c.inner.Brightness(ctx, func(params cp.LightController_brightness_Params) error {
		params.SetLevel(brightness)
		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// Queue sets the display mode to queue which will cause all writes to the strip to be buffered until a call to Show
func (c *Controller) Queue(ctx context.Context) {
	result, free := c.inner.Mode(ctx, func(params cp.LightController_mode_Params) error {
		params.SetMode(cp.Mode_queue)
		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// Instant sets the display mode to instant which causes all writes to be committed as they arrive
func (c *Controller) Instant(ctx context.Context) {
	result, free := c.inner.Mode(ctx, func(params cp.LightController_mode_Params) error {
		params.SetMode(cp.Mode_instant)
		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// Show commits any queued writes to the strip. This is a no-op in Instant mode.
func (c *Controller) Show(ctx context.Context) {
	result, free := c.inner.Show(ctx, func(params cp.LightController_show_Params) error {
		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// SetAll sets all the pixels to the specified colors at once
func (c *Controller) SetAll(ctx context.Context, pixels []database.Color) {
	result, free := c.inner.SetAll(ctx, func(params cp.LightController_setAll_Params) error {
		// Create the list
		list, err := params.NewColors(int32(len(pixels)))
		if err != nil {
			return err
		}

		// Fill the pixels
		for i, pixel := range pixels {
			color, err := cp.NewColor(list.Segment())
			if err != nil {
				return err
			}
			color.SetR(pixel.Red)
			color.SetG(pixel.Green)
			color.SetB(pixel.Blue)

			if err := list.Set(i, color); err != nil {
				return err
			}
		}

		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// StartAnimation starts the specified animation (if it exists)
func (c *Controller) StartAnimation(ctx context.Context, id string) {
	result, free := c.inner.Animate(ctx, func(params cp.LightController_animate_Params) error {
		return params.SetName(id)
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// StopAnimation stops the currently running animation (if it exists)
func (c *Controller) StopAnimation(ctx context.Context) {
	result, free := c.inner.StopAnimation(ctx, func(params cp.LightController_stopAnimation_Params) error {
		return nil
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}

// RegisterAnimation creates a new animation on the controller and compiles it
func (c *Controller) RegisterAnimation(ctx context.Context, id string, wasm []byte) bool {
	result, free := c.inner.RegisterAnimation(ctx, func(params cp.LightController_registerAnimation_Params) error {
		if err := params.SetName(id); err != nil {
			return err
		}
		return params.SetAnimation(wasm)
	})
	defer free()

	<-result.Done()

	// Get the response
	data, err := result.Struct()
	if err != nil {
		c.ReportError(err)
		return false
	}

	return data.Success()
}

// UnregisterAnimation removes an animation from the controller (if it exists)
func (c *Controller) UnregisterAnimation(ctx context.Context, id string) {
	result, free := c.inner.UnregisterAnimation(ctx, func(params cp.LightController_unregisterAnimation_Params) error {
		return params.SetName(id)
	})
	defer free()

	<-result.Done()
	if _, err := result.Struct(); err != nil {
		c.ReportError(err)
	}
}
