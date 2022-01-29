package schedules

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
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
		} else if schedule.Preset == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'preset_name'"))
			return
		}
	case database.ScheduleTypeAnimation:
		if updatedFields.Animation != nil {
			schedule.Animation = updatedFields.Animation
		} else if schedule.Color == nil {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("missing required field 'animation_name'"))
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
