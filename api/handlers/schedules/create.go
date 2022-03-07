package schedules

import (
	"encoding/json"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/events"
	"github.com/akrantz01/lights/api/handlers"
	"github.com/akrantz01/lights/api/logging"
	"github.com/akrantz01/lights/api/scheduler"
)

// Create a new schedule in the database
func create(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:create")
	s := scheduler.GetScheduler(r.Context())

	var schedule database.Schedule
	if err := json.NewDecoder(r.Body).Decode(&schedule); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Validate the time
	if len(schedule.Name) == 0 {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("name must be present"))
		return
	}
	if _, err := time.Parse("15:04", schedule.At); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("time format must match 'hh:mm'"))
		return
	}

	// Validate the schedule and remove unnecessary fields
	valid := false
	switch schedule.Type {
	case database.ScheduleTypeFill:
		valid = schedule.Color != nil
		schedule.Animation = nil
		schedule.Preset = nil
	case database.ScheduleTypePreset:
		valid = schedule.Preset != nil
		schedule.Color = nil
		schedule.Animation = nil

		// Check that the preset exists
		if _, err := db.GetPreset(*schedule.Preset); err == database.ErrNotFound {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("preset not found"))
			return
		} else if err != nil {
			handlers.Respond(w, handlers.AsFatal())
			l.Error("failed to check existence of preset", zap.Error(err), zap.String("name", *schedule.Preset))
			return
		}
	case database.ScheduleTypeAnimation:
		valid = schedule.Animation != nil
		schedule.Color = nil
		schedule.Preset = nil

		// Check that the animation exists
		if _, err := db.GetAnimation(*schedule.Animation); err == database.ErrNotFound {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("animation not found"))
			return
		} else if err != nil {
			handlers.Respond(w, handlers.AsFatal())
			l.Error("failed to check existence of animation", zap.Error(err), zap.String("name", *schedule.Animation))
			return
		}
	default:
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("unknown schedule type"))
		return
	}
	if !valid {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid request fields"))
		return
	}

	// Add the schedule to the scheduler
	if err := s.Add(schedule.Name, schedule.At, schedule.Repeats); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to register schedule", zap.Error(err))
		return
	}

	// Save to database
	database.GenerateId(&schedule)
	schedule.Enabled = true
	if err := db.AddSchedule(schedule); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to insert into database", zap.Error(err))
	} else {
		emitter.PublishScheduleCreatedEvent(schedule)
		handlers.Respond(w)
	}
}
