package schedules

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/scheduler"
)

// The body containing the fields that are allowed to be updated
type scheduleUpdate struct {
	At        *string                   `json:"at"`
	Repeats   *database.ScheduleRepeats `json:"repeats"`
	Type      *database.ScheduleType    `json:"type"`
	Color     *database.Color           `json:"color"`
	Preset    *string                   `json:"preset"`
	Animation *string                   `json:"animation"`
}

// Update properties for a schedule
func update(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())
	s := scheduler.GetScheduler(r.Context())

	// Ensure the schedule exists
	schedule, err := db.GetSchedule(name)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
		return
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:update").Error("failed to get schedule", zap.Error(err), zap.String("name", name))
		return
	}

	var updatedFields scheduleUpdate
	if err := json.NewDecoder(r.Body).Decode(&updatedFields); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Update the time and repetition days
	if updatedFields.At != nil {
		schedule.At = *updatedFields.At
	}
	if updatedFields.Repeats != nil {
		schedule.Repeats = *updatedFields.Repeats
	}

	// Validate and update the type
	if updatedFields.Type != nil {
		switch schedule.Type {
		case database.ScheduleTypeFill:
			schedule.Preset = nil
			schedule.Animation = nil
		case database.ScheduleTypePreset:
			schedule.Color = nil
			schedule.Animation = nil
		case database.ScheduleTypeAnimation:
			schedule.Color = nil
			schedule.Preset = nil
		default:
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("unknown schedule type"))
			return
		}
	}

	// Set fields based on the type
	switch schedule.Type {
	case database.ScheduleTypeFill:
		if updatedFields.Color != nil {
			schedule.Color = updatedFields.Color
		} else if schedule.Color == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'color'"))
			return
		}
	case database.ScheduleTypePreset:
		if updatedFields.Preset != nil {
			schedule.Preset = updatedFields.Preset

			// Check the preset exists
			if _, err := db.GetPreset(*schedule.Preset); err == database.ErrNotFound {
				handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("preset not found"))
				return
			} else if err != nil {
				handlers.Respond(w, handlers.AsFatal())
				zap.L().Named("schedules:update").Error("failed to check existence of preset", zap.Error(err), zap.String("name", *schedule.Preset))
				return
			}
		} else if schedule.Preset == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'preset'"))
			return
		}
	case database.ScheduleTypeAnimation:
		if updatedFields.Animation != nil {
			schedule.Animation = updatedFields.Animation

			// Check that the animation exists
			if _, err := db.GetAnimation(*schedule.Animation); err == database.ErrNotFound {
				handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("animation not found"))
				return
			} else if err != nil {
				handlers.Respond(w, handlers.AsFatal())
				zap.L().Named("schedules:update").Error("failed to check existence of animation", zap.Error(err), zap.String("name", *schedule.Animation))
				return
			}
		} else if schedule.Animation == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'animation'"))
			return
		}
	}

	// Update the schedule job if the repeated days or at changes
	if updatedFields.At != nil || updatedFields.Repeats != nil {
		s.Remove(schedule.Name)
		if err := s.Add(schedule.Name, schedule.At, schedule.Repeats); err != nil {
			handlers.Respond(w, handlers.AsFatal())
			zap.L().Named("schedules:update").Error("failed to update job", zap.Error(err), zap.String("name", name))
			return
		}
	}

	// Save the changes
	if err := db.AddSchedule(schedule); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:update").Error("failed to update schedule", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w)
	}
}
