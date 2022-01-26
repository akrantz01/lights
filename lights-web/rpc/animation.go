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

func (sa StartAnimation) Execute(ctx context.Context, _ *database.Database, controller lights.LightController) error {
	result, free := controller.Animate(ctx, func(params lights.LightController_animate_Params) error {
		return params.SetName(sa.Name)
	})
	defer free()
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

func (sa StopAnimation) Execute(ctx context.Context, _ *database.Database, controller lights.LightController) error {
	result, free := controller.StopAnimation(ctx, func(params lights.LightController_stopAnimation_Params) error {
		return nil
	})
	defer free()
	<-result.Done()

	return nil
}
