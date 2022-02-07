package schedules

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/scheduler"
)

// The body containing the fields that are allowed to be updated
type scheduleUpdate struct {
	Name      *string                   `json:"name"`
	At        *string                   `json:"at"`
	Repeats   *database.ScheduleRepeats `json:"repeats"`
	Type      *database.ScheduleType    `json:"type"`
	Color     *database.Color           `json:"color"`
	Preset    *string                   `json:"preset"`
	Animation *string                   `json:"animation"`
}

// Update properties for a schedule
func update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:update").With(zap.String("id", id))
	s := scheduler.GetScheduler(r.Context())

	// Ensure the schedule exists
	schedule, err := db.GetSchedule(id)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
		return
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to get schedule", zap.Error(err))
		return
	}

	var updatedFields scheduleUpdate
	if err := json.NewDecoder(r.Body).Decode(&updatedFields); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Update the name, time, and repetition days
	if updatedFields.Name != nil {
		if len(*updatedFields.Name) == 0 {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("name length must be greater than 0"))
			return
		} else {
			schedule.Name = *updatedFields.Name
		}
	}
	if updatedFields.At != nil {
		if _, err := time.Parse("15:04", *updatedFields.At); err == nil {
			schedule.At = *updatedFields.At
		} else {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("time format must match 'hh:mm'"))
			return
		}
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
				l.Error("failed to check existence of preset", zap.Error(err))
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
				l.Error("failed to check existence of animation", zap.Error(err))
				return
			}
		} else if schedule.Animation == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'animation'"))
			return
		}
	}

	// Update the schedule job if the repeated days or at changes
	if updatedFields.At != nil || updatedFields.Repeats != nil {
		s.Remove(schedule.Id)
		if err := s.Add(schedule.Id, schedule.At, schedule.Repeats); err != nil {
			handlers.Respond(w, handlers.AsFatal())
			l.Error("failed to update job", zap.Error(err))
			return
		}
	}

	// Save the changes
	if err := db.AddSchedule(schedule); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to update schedule", zap.Error(err))
	} else {
		handlers.Respond(w)
	}
}
