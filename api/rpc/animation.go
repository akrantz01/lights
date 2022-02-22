package rpc

import (
	"context"

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

func (sa StartAnimation) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.StartAnimation(ctx, sa.Id)

	// Update the current database state
	if err := db.SetPixelMode(database.PixelModeAnimation); err != nil {
		return err
	}
	if err := db.SetCurrentAnimation(sa.Id); err != nil {
		return err
	}

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

func (sa StopAnimation) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.StopAnimation(ctx)

	// Update the database state
	if err := db.SetCurrentAnimation(""); err != nil {
		return err
	}

	return nil
}

// AddAnimation registers an animation with the controller
type AddAnimation struct {
	Id       string
	Wasm     []byte
	Response chan bool
}

func NewAddAnimation(id string, wasm []byte) (AddAnimation, chan bool) {
	success := make(chan bool)
	return AddAnimation{
		Id:       id,
		Wasm:     wasm,
		Response: success,
	}, success
}

func (aa AddAnimation) Type() string {
	return "add-animation"
}

func (aa AddAnimation) Execute(ctx context.Context, _ *database.Database, controller *lights.Controller) error {
	success, err := controller.RegisterAnimation(ctx, aa.Id, aa.Wasm)
	if err != nil {
		return err
	}

	// Send back status
	aa.Response <- success

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

func (ra RemoveAnimation) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.UnregisterAnimation(ctx, ra.Id)

	// Remove animation from database
	if err := db.RemoveAnimation(ra.Id); err != nil {
		return err
	}

	return nil
}
