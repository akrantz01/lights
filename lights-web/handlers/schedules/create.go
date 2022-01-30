package schedules

import (
	"encoding/json"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/scheduler"
)

// Create a new schedule in the database
func create(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	s := scheduler.GetScheduler(r.Context())

	var schedule database.Schedule
	if err := json.NewDecoder(r.Body).Decode(&schedule); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Validate the time
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
			zap.L().Named("schedules:create").Error("failed to check existence of preset", zap.Error(err), zap.String("name", *schedule.Preset))
			return
		}
	case database.ScheduleTypeAnimation:
		valid = schedule.Animation != nil
		schedule.Color = nil
		schedule.Preset = nil

		// Check that the animation exists
		animations, err := db.ListAnimations()
		if err != nil {
			handlers.Respond(w, handlers.AsFatal())
			zap.L().Named("schedules:create").Error("failed to list animations", zap.Error(err))
			return
		}
		found := false
		for _, animation := range animations {
			if animation == *schedule.Animation {
				found = true
				break
			}
		}
		if !found {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("animation not found"))
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
		zap.L().Named("schedules:create").Error("failed to register schedule", zap.Error(err))
		return
	}

	// Save to database
	if err := db.AddSchedule(schedule); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:create").Error("failed to insert into database", zap.Error(err))
	} else {
		handlers.Respond(w)
	}
}
