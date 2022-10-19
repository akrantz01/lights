package schedules

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
	"github.com/akrantz01/lights/api/scheduler"
)

// Router registers all the methods for handling schedules
func Router(v *validator.Validator) func(r chi.Router) {
	m := auth.Middleware(v, auth.PermissionEdit)

	return func(r chi.Router) {
		r.Get("/", list)
		r.With(m).Post("/", create)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", read)
			r.With(m).Patch("/", update)
			r.With(m).Delete("/", remove)

			r.With(m).Put("/toggle", toggle)
		})
	}
}

// Get a list of all schedules
func list(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:list")

	schedules, err := db.ListSchedules()
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to list schedules", zap.Error(err))
	} else if schedules == nil {
		handlers.Respond(w, handlers.WithData([]string{}))
	} else {
		handlers.Respond(w, handlers.WithData(schedules))
	}
}

// Get all the details about a schedule
func read(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:read").With(zap.String("id", id))

	schedule, err := db.GetSchedule(id)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithData(404), handlers.WithError("not found"))
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to read schedule", zap.Error(err))
	} else {
		handlers.Respond(w, handlers.WithData(schedule))
	}
}

// Remove a schedule from the database
func remove(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:remove").With(zap.String("id", id))
	s := scheduler.GetScheduler(r.Context())

	// Remove from scheduler
	s.Remove(id)

	// Remove from database
	if err := db.RemoveSchedule(id); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to delete schedule", zap.Error(err))
	} else {
		emitter.PublishScheduleRemoveEvent(id)
		handlers.Respond(w)
	}
}
