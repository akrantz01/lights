package presets

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
)

// Router registers all the methods for handling presets
func Router(r chi.Router) {
	r.Get("/", list)
	r.Post("/", create)

	r.Get("/{name}", read)
	r.Patch("/{name}", update)
	r.Delete("/{name}", remove)
}

// Get a list of all presets
func list(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())

	presets, err := db.ListPresets()
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("presets:list").Error("failed to list presets", zap.Error(err))
	} else if presets == nil {
		handlers.Respond(w, handlers.WithData([]string{}))
	} else {
		handlers.Respond(w, handlers.WithData(presets))
	}
}

// Get all the details of a preset
func read(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())

	preset, err := db.GetPreset(name)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("presets:read").Error("failed to read preset", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w, handlers.WithData(preset))
	}
}

// Delete a preset from the database
func remove(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())

	if err := db.RemovePreset(name); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("presets:remove").Error("failed to delete preset", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w)
	}
}
