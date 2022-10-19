package presets

import (
	"net/http"

	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/auth"
	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/events"
	"github.com/akrantz01/lights/api/handlers"
	"github.com/akrantz01/lights/api/logging"
)

// Router registers all the methods for handling presets
func Router(v *validator.Validator) func(r chi.Router) {
	m := auth.Middleware(v, auth.PermissionEdit)

	return func(r chi.Router) {
		r.Get("/", list)
		r.With(m).Post("/", create)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", read)
			r.With(m).Patch("/", update)
			r.With(m).Delete("/", remove)
		})
	}
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
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "presets:read").With(zap.String("id", id))

	preset, err := db.GetPreset(id)
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
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	l := logging.GetLogger(r.Context(), "presets:remove").With(zap.String("id", id))

	if err := db.RemovePreset(id); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to delete preset", zap.Error(err))
	} else {
		emitter.PublishPresetRemoveEvent(id)
		handlers.Respond(w)
	}
}
