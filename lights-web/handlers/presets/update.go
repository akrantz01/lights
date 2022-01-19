package presets

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
)

// The body containing the fields that are allowed to be updated
type presetUpdate struct {
	Brightness *uint8           `json:"brightness"`
	Pixels     []database.Color `json:"pixels"`
}

// Change the pixels or brightness in the preset
func update(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())
	length := handlers.GetStripLength(r.Context())

	// Ensure the preset exists
	preset, err := db.GetPreset(name)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
		return
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("presets:update").Error("failed to get preset", zap.Error(err), zap.String("name", name))
		return
	}

	var updatedFields presetUpdate
	if err := json.NewDecoder(r.Body).Decode(&updatedFields); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Validate and update the fields
	if pixels := len(updatedFields.Pixels); pixels != 0 {
		if pixels == int(length) {
			preset.Pixels = updatedFields.Pixels
		} else {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("mismatch pixel length"))
			return
		}
	}
	if updatedFields.Brightness != nil {
		if *updatedFields.Brightness <= 100 {
			preset.Brightness = *updatedFields.Brightness
		} else {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("brightness cannot exceed 100"))
			return
		}
	}

	// Save the changes
	if err := db.AddPreset(preset); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("presets:update").Error("failed to update preset", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w)
	}
}
