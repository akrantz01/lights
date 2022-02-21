package animations

import (
	"net/http"

	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/auth"
	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/events"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Router registers all the methods for handling animations
func Router(v *validator.Validator) func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", list)
		r.With(auth.Middleware(v)).Post("/", create)

		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", read)
			r.With(auth.Middleware(v)).Patch("/", update)
			r.With(auth.Middleware(v)).Delete("/", remove)
		})
	}
}

// Get a list of all animations
func list(w http.ResponseWriter, r *http.Request) {
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "animations:list")

	animations, err := db.ListAnimations()
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to list animations", zap.Error(err))
	} else if animations == nil {
		handlers.Respond(w, handlers.WithData([]string{}))
	} else {
		handlers.Respond(w, handlers.WithData(animations))
	}
}

// Get extra details about an animation
func read(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "animations:read").With(zap.String("id", id))

	animation, err := db.GetAnimation(id)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to read animation", zap.Error(err))
	} else {
		handlers.Respond(w, handlers.WithData(animation))
	}
}

// Delete an animation from the database
func remove(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	actions := rpc.GetActions(r.Context())
	emitter := events.GetEmitter(r.Context())

	actions <- rpc.NewRemoveAnimation(id)
	emitter.PublishAnimationRemoveEvent(id)
	handlers.Respond(w)
}
