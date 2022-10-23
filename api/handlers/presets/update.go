package presets

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/events"
	"github.com/akrantz01/lights/api/handlers"
	"github.com/akrantz01/lights/api/logging"
)

// The body containing the fields that are allowed to be updated
type presetUpdate struct {
	Name       *string          `json:"name"`
	Brightness *uint8           `json:"brightness"`
	Pixels     []database.Color `json:"pixels"`
}

// Change the pixels or brightness in the preset
func update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	length := handlers.GetStripLength(r.Context())
	l := logging.GetLogger(r.Context(), "presets:update").With(zap.String("id", id))

	// Ensure the preset exists
	preset, err := db.GetPreset(id)
	if errors.Is(err, database.ErrNotFound) {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
		return
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to get preset", zap.Error(err))
		return
	}

	var updatedFields presetUpdate
	if err := json.NewDecoder(r.Body).Decode(&updatedFields); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Track the updated fields for the cache update
	fields := make(map[string]interface{})

	// Validate and update the fields
	if updatedFields.Name != nil {
		if len(*updatedFields.Name) == 0 {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("name length must be greater than 0"))
			return
		}

		preset.Name = *updatedFields.Name
		fields["name"] = *updatedFields.Name
	}
	if pixels := len(updatedFields.Pixels); pixels != 0 {
		if pixels != int(length) {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("mismatch pixel length"))
			return
		}

		preset.Pixels = updatedFields.Pixels
		fields["pixels"] = updatedFields.Pixels
	}
	if updatedFields.Brightness != nil {
		if *updatedFields.Brightness > 100 {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("brightness cannot exceed 100"))
			return
		}

		preset.Brightness = *updatedFields.Brightness
		fields["brightness"] = *updatedFields.Brightness
	}

	// Save the changes
	if err := db.AddPreset(preset); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to update preset", zap.Error(err))
	} else {
		emitter.PublishPresetUpdateEvent(id, fields)
		handlers.Respond(w)
	}
}
