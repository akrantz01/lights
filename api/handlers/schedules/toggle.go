package schedules

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/events"
	"github.com/akrantz01/lights/api/handlers"
	"github.com/akrantz01/lights/api/logging"
	"github.com/akrantz01/lights/api/scheduler"
)

// Toggle the enabled status of a given schedule
// If the `enabled` field is not present, then it will toggle the value
func toggle(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	l := logging.GetLogger(r.Context(), "schedules:enabled").With(zap.String("id", id))
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

	schedule.Enabled = !schedule.Enabled

	// Determine whether the job needs to be started or stopped
	if schedule.Enabled {
		if err := s.Add(id, schedule.At, schedule.Repeats); err != nil {
			handlers.Respond(w, handlers.AsFatal())
			l.Error("failed to schedule job", zap.Error(err))
			return
		}
	} else {
		s.Remove(id)
	}

	// Save any changes
	if err := db.AddSchedule(schedule); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to update schedule", zap.Error(err))
	} else {
		emitter.PublishScheduleUpdateEvent(id, map[string]interface{}{"enabled": schedule.Enabled})
		handlers.Respond(w)
	}
}
