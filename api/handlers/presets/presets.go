package presets

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
)

// Router registers all the methods for handling presets
func Router(r chi.Router) {
	r.Get("/", list)
	r.Post("/", create)

	r.Get("/{slug}", read)
	r.Patch("/{slug}", update)
	r.Delete("/{slug}", remove)
}

// Get a list of all presets
func list(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "presets:list")

	presets, err := db.ListPresets()
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to list presets", zap.Error(err))
	} else if presets == nil {
		handlers.Respond(w, handlers.WithData([]string{}))
	} else {
		handlers.Respond(w, handlers.WithData(presets))
	}
}

// Get all the details of a preset
func read(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "presets:read").With(zap.String("slug", slug))

	preset, err := db.GetPreset(slug)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to read preset", zap.Error(err))
	} else {
		handlers.Respond(w, handlers.WithData(preset))
	}
}

// Delete a preset from the database
func remove(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "presets:remove").With(zap.String("slug", slug))

	if err := db.RemovePreset(slug); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to delete preset", zap.Error(err))
	} else {
		handlers.Respond(w)
	}
}
