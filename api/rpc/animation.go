package rpc

import (
	"context"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// StartAnimation queues an animation to be started
type StartAnimation struct {
	Name string
}

func NewStartAnimation(name string) StartAnimation {
	return StartAnimation{
		Name: name,
	}
}

func (sa StartAnimation) Type() string {
	return "start-animation"
}

func (sa StartAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Start the animation
	result, free := controller.Animate(ctx, func(params lights.LightController_animate_Params) error {
		return params.SetName(sa.Name)
	})
	defer free()

	// Update the current database state
	if err := db.SetPixelMode(database.PixelModeAnimation); err != nil {
		return err
	}
	if err := db.SetCurrentAnimation(sa.Name); err != nil {
		return err
	}

	<-result.Done()

	return nil
}

// StopAnimation halts the current animation
type StopAnimation struct{}

func NewStopAnimation() StopAnimation {
	return StopAnimation{}
}

func (sa StopAnimation) Type() string {
	return "stop-animation"
}

func (sa StopAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Stop the animation
	result, free := controller.StopAnimation(ctx, func(params lights.LightController_stopAnimation_Params) error {
		return nil
	})
	defer free()

	// Update the database state
	if err := db.SetCurrentAnimation(""); err != nil {
		return err
	}

	<-result.Done()

	return nil
}

// AddAnimation registers an animation with the controller
type AddAnimation struct {
	Name     string
	Wasm     []byte
	Response chan bool
}

func NewAddAnimation(name string, wasm []byte) (AddAnimation, chan bool) {
	success := make(chan bool)
	return AddAnimation{
		Name:     name,
		Wasm:     wasm,
		Response: success,
	}, success
}

func (aa AddAnimation) Type() string {
	return "add-animation"
}

func (aa AddAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Add the animation
	result, free := controller.RegisterAnimation(ctx, func(params lights.LightController_registerAnimation_Params) error {
		if err := params.SetName(aa.Name); err != nil {
			return err
		}
		return params.SetAnimation(aa.Wasm)
	})
	defer free()

	// Send back success status
	<-result.Done()
	data, err := result.Struct()
	if err != nil {
		return err
	}
	aa.Response <- data.Success()

	// Add the animation to the database when successful
	if data.Success() {
		return db.AddAnimation(aa.Name)
	}
	return nil
}

// RemoveAnimation deletes an animation from the controller
type RemoveAnimation struct {
	Name string
}

func NewRemoveAnimation(name string) RemoveAnimation {
	return RemoveAnimation{
		Name: name,
	}
}

func (ra RemoveAnimation) Type() string {
	return "remove-animation"
}

func (ra RemoveAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Remove the animation
	result, free := controller.UnregisterAnimation(ctx, func(params lights.LightController_unregisterAnimation_Params) error {
		return params.SetName(ra.Name)
	})
	defer free()

	// Remove animation from database
	if err := db.RemoveAnimation(ra.Name); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
