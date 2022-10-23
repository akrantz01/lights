package rpc

import (
	"context"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/lights"
)

// StartAnimation queues an animation to be started
type StartAnimation struct {
	ID string
}

func NewStartAnimation(id string) StartAnimation {
	return StartAnimation{
		ID: id,
	}
}

func (sa StartAnimation) Type() string {
	return "start-animation"
}

func (sa StartAnimation) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.StartAnimation(ctx, sa.ID)

	// Update the current database state
	if err := db.SetPixelMode(database.PixelModeAnimation); err != nil {
		return err
	}
	return db.SetCurrentAnimation(sa.ID)
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
	return db.SetCurrentAnimation("")
}

// AddAnimation registers an animation with the controller
type AddAnimation struct {
	ID       string
	Wasm     []byte
	Response chan bool
}

func NewAddAnimation(id string, wasm []byte) (AddAnimation, chan bool) {
	success := make(chan bool)
	return AddAnimation{
		ID:       id,
		Wasm:     wasm,
		Response: success,
	}, success
}

func (aa AddAnimation) Type() string {
	return "add-animation"
}

func (aa AddAnimation) Execute(ctx context.Context, _ *database.Database, controller *lights.Controller) error {
	success := controller.RegisterAnimation(ctx, aa.ID, aa.Wasm)
	aa.Response <- success

	return nil
}

// RemoveAnimation deletes an animation from the controller
type RemoveAnimation struct {
	ID string
}

func NewRemoveAnimation(id string) RemoveAnimation {
	return RemoveAnimation{
		ID: id,
	}
}

func (ra RemoveAnimation) Type() string {
	return "remove-animation"
}

func (ra RemoveAnimation) Execute(ctx context.Context, db *database.Database, controller *lights.Controller) error {
	controller.UnregisterAnimation(ctx, ra.ID)

	// Remove animation from database
	return db.RemoveAnimation(ra.ID)
}
