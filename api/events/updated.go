package events

import (
	"encoding/json"

	"github.com/r3labs/sse/v2"
	"go.uber.org/zap"
)

var updated = []byte("updated")

// PublishAnimationUpdateEvent emits a new event for when an animation is updated. It only includes the fields that were
// updated in the event.
func (e *Emitter) PublishAnimationUpdateEvent(id string, fields map[string]interface{}) {
	e.publishUpdateEvent(animationStream, id, fields)
}

// PublishPresetUpdateEvent emits a new event for when a preset is updated. It only includes the fields that were
// updated in the event.
func (e *Emitter) PublishPresetUpdateEvent(id string, fields map[string]interface{}) {
	e.publishUpdateEvent(presetStream, id, fields)
}

// PublishScheduleUpdateEvent emits a new event for when a schedule is updated. It only includes the fields that were
// updated in the event.
func (e *Emitter) PublishScheduleUpdateEvent(id string, fields map[string]interface{}) {
	e.publishUpdateEvent(scheduleStream, id, fields)
}

// publishUpdateEvent does the sending of update event
func (e *Emitter) publishUpdateEvent(stream, id string, fields map[string]interface{}) {
	// Add the object id to the event
	fields["id"] = id

	encoded, err := json.Marshal(fields)
	if err != nil {
		zap.L().Named("events:updated:"+stream).Error("failed to encode event data", zap.Any(stream, fields))
		return
	}

	e.server.Publish(stream, &sse.Event{
		Event: updated,
		Data:  encoded,
	})
}
