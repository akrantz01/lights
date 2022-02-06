package rpc

import (
	"context"

	gonanoid "github.com/matoous/go-nanoid"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
)

// StartAnimation queues an animation to be started
type StartAnimation struct {
	Id string
}

func NewStartAnimation(id string) StartAnimation {
	return StartAnimation{
		Id: id,
	}
}

func (sa StartAnimation) Type() string {
	return "start-animation"
}

func (sa StartAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Start the animation
	result, free := controller.Animate(ctx, func(params lights.LightController_animate_Params) error {
		return params.SetName(sa.Id)
	})
	defer free()

	// Update the current database state
	if err := db.SetPixelMode(database.PixelModeAnimation); err != nil {
		return err
	}
	if err := db.SetCurrentAnimation(sa.Id); err != nil {
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
	id := gonanoid.MustID(8)

	// Add the animation
	result, free := controller.RegisterAnimation(ctx, func(params lights.LightController_registerAnimation_Params) error {
		if err := params.SetName(id); err != nil {
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
		return db.AddAnimation(database.Animation{
			Id:   id,
			Name: aa.Name,
		})
	}
	return nil
}

// RemoveAnimation deletes an animation from the controller
type RemoveAnimation struct {
	Id string
}

func NewRemoveAnimation(id string) RemoveAnimation {
	return RemoveAnimation{
		Id: id,
	}
}

func (ra RemoveAnimation) Type() string {
	return "remove-animation"
}

func (ra RemoveAnimation) Execute(ctx context.Context, db *database.Database, controller lights.LightController) error {
	// Remove the animation
	result, free := controller.UnregisterAnimation(ctx, func(params lights.LightController_unregisterAnimation_Params) error {
		return params.SetName(ra.Id)
	})
	defer free()

	// Remove animation from database
	if err := db.RemoveAnimation(ra.Id); err != nil {
		return err
	}

	<-result.Done()

	return nil
}
