package events

import (
	"encoding/json"

	"github.com/r3labs/sse/v2"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/database"
)

var created = []byte("created")

// PublishAnimationCreatedEvent emits a new event for when an animation is created
func (e *Emitter) PublishAnimationCreatedEvent(animation database.Animation) {
	encoded, err := json.Marshal(animation)
	if err != nil {
		zap.L().Named("events:created:animation").Error("failed to encode event data", zap.Any("animation", animation))
		return
	}

	e.server.Publish(animationStream, &sse.Event{
		Event: created,
		Data:  encoded,
	})
}

// PublishPresetCreatedEvent emits a new event for when a preset is created
func (e *Emitter) PublishPresetCreatedEvent(preset database.Preset) {
	encoded, err := json.Marshal(preset.AsPartial())
	if err != nil {
		zap.L().Named("events:created:preset").Error("failed to encode event data", zap.Any("preset", preset))
		return
	}

	e.server.Publish(presetStream, &sse.Event{
		Event: created,
		Data:  encoded,
	})
}

// PublishScheduleCreatedEvent emits a new event for when a schedule is created
func (e *Emitter) PublishScheduleCreatedEvent(schedule database.Schedule) {
	encoded, err := json.Marshal(schedule.AsPartial())
	if err != nil {
		zap.L().Named("events:created:schedule").Error("failed to encode event data", zap.Any("schedule", schedule))
		return
	}

	e.server.Publish(scheduleStream, &sse.Event{
		Event: created,
		Data:  encoded,
	})
}
