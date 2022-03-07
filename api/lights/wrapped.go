package lights

import (
	"context"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights/pb"
)

var logger = zap.L().Named("controller")

// Set changes the color of pixels at the given indexes
func (c *Controller) Set(ctx context.Context, indexes []uint32, color database.Color) {
	_, err := c.inner.Set(ctx, &pb.SetArgs{
		Indexes: indexes,
		Color: &pb.Color{
			R: uint32(color.Red),
			G: uint32(color.Green),
			B: uint32(color.Blue),
		},
	})
	if err != nil {
		logger.Error("failed to set index(es)", zap.Uint32s("indexes", indexes), zap.Any("color", color), zap.Error(err))
	}
}

// Fill changes the color of the entire strip
func (c *Controller) Fill(ctx context.Context, color database.Color) {
	_, err := c.inner.Fill(ctx, &pb.Color{
		R: uint32(color.Red),
		G: uint32(color.Green),
		B: uint32(color.Blue),
	})
	if err != nil {
		logger.Error("failed to fill strip", zap.Any("color", color), zap.Error(err))
	}
}

// Brightness sets the brightness of the entire strip
func (c *Controller) Brightness(ctx context.Context, brightness uint8) {
	_, err := c.inner.Brightness(ctx, &pb.BrightnessArgs{
		Brightness: uint32(brightness),
	})
	if err != nil {
		logger.Error("failed to set brightness", zap.Uint8("level", brightness), zap.Error(err))
	}
}

// SetAll sets all the pixels to the specified colors at once
func (c *Controller) SetAll(ctx context.Context, pixels []database.Color) {
	var pbColors []*pb.Color
	for _, pixel := range pixels {
		pbColors = append(pbColors, &pb.Color{
			R: uint32(pixel.Red),
			G: uint32(pixel.Green),
			B: uint32(pixel.Blue),
		})
	}

	_, err := c.inner.SetAll(ctx, &pb.SetAllArgs{
		Colors: pbColors,
	})
	if err != nil {
		logger.Error("failed to set all pixels", zap.Any("pixels", pixels), zap.Error(err))
	}
}

// StartAnimation starts the specified animation (if it exists)
func (c *Controller) StartAnimation(ctx context.Context, id string) {
	_, err := c.inner.StartAnimation(ctx, &pb.StartAnimationArgs{
		Id: id,
	})
	if err != nil {
		logger.Error("failed to start animation", zap.String("id", id), zap.Error(err))
	}
}

// StopAnimation stops the currently running animation (if it exists)
func (c *Controller) StopAnimation(ctx context.Context) {
	if _, err := c.inner.StopAnimation(ctx, &pb.Empty{}); err != nil {
		logger.Error("failed to stop animation", zap.Error(err))
	}
}

// RegisterAnimation creates a new animation on the controller and compiles it
func (c *Controller) RegisterAnimation(ctx context.Context, id string, wasm []byte) bool {
	result, err := c.inner.RegisterAnimation(ctx, &pb.RegisterAnimationArgs{
		Id:   id,
		Wasm: wasm,
	})
	if err != nil {
		logger.Error("failed to register animation", zap.String("id", id), zap.Error(err))
		return false
	}

	return result.Success
}

// UnregisterAnimation removes an animation from the controller (if it exists)
func (c *Controller) UnregisterAnimation(ctx context.Context, id string) {
	_, err := c.inner.UnregisterAnimation(ctx, &pb.UnregisterAnimationArgs{
		Id: id,
	})
	if err != nil {
		logger.Error("failed to unregister animation", zap.String("id", id), zap.Error(err))
	}
}
