package presets

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
)

// Create a new preset in the database
func create(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	length := handlers.GetStripLength(r.Context())
	l := logging.GetLogger(r.Context(), "presets:create")

	var preset database.Preset
	if err := json.NewDecoder(r.Body).Decode(&preset); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid JSON request"))
		return
	}

	// Validate the preset
	if len(preset.Pixels) != int(length) {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("mismatch pixel length"))
		return
	}
	if len(preset.Name) == 0 {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("name must be preset"))
		return
	}
	if preset.Brightness > 100 {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("brightness cannot exceed 100"))
		return
	}

	// Save to database
	if err := db.AddPreset(preset); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to insert into database", zap.Error(err), zap.String("name", preset.Name))
	} else {
		handlers.Respond(w)
	}
}
