package events

import (
	"encoding/json"

	"github.com/r3labs/sse/v2"
	"go.uber.org/zap"
)

var removed = []byte("removed")

// PublishAnimationRemoveEvent emits a new event for when an animation is removed
func (e *Emitter) PublishAnimationRemoveEvent(id string) {
	e.publishRemoveEvent(animationStream, id)
}

// PublishPresetRemoveEvent emits a new event for when a preset is removed
func (e *Emitter) PublishPresetRemoveEvent(id string) {
	e.publishRemoveEvent(presetStream, id)
}

// PublishScheduleRemoveEvent emits a new event for when a schedule is removed
func (e *Emitter) PublishScheduleRemoveEvent(id string) {
	e.publishRemoveEvent(scheduleStream, id)
}

// publishRemoveEvent does the sending of the remove event
func (e *Emitter) publishRemoveEvent(stream, id string) {
	encoded, err := json.Marshal(map[string]string{"id": id})
	if err != nil {
		zap.L().Named("events:removed:"+stream).Error("failed to encode event data", zap.String("id", id))
		return
	}

	e.server.Publish(stream, &sse.Event{
		Event: removed,
		Data:  encoded,
	})
}
