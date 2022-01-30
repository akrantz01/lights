package schedules

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/scheduler"
)

// Router registers all the methods for handling schedules
func Router(r chi.Router) {
	r.Get("/", list)
	r.Post("/", create)

	r.Get("/{name}", read)
	r.Patch("/{name}", update)
	r.Delete("/{name}", remove)
}

// Get a list of all schedules
func list(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())

	schedules, err := db.ListSchedules()
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:list").Error("failed to list schedules", zap.Error(err))
	} else if schedules == nil {
		handlers.Respond(w, handlers.WithData([]string{}))
	} else {
		handlers.Respond(w, handlers.WithData(schedules))
	}
}

// Get all the details about a schedule
func read(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())

	schedule, err := db.GetSchedule(name)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithData(404), handlers.WithError("not found"))
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:read").Error("failed to read schedule", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w, handlers.WithData(schedule))
	}
}

// Remove a schedule from the database
func remove(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	db := database.GetDatabase(r.Context())
	s := scheduler.GetScheduler(r.Context())

	// Remove from scheduler
	s.Remove(name)

	// Remove from database
	if err := db.RemoveSchedule(name); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("schedules:remove").Error("failed to delete schedule", zap.Error(err), zap.String("name", name))
	} else {
		handlers.Respond(w)
	}
}
