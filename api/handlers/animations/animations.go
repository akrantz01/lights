package animations

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Router registers all the methods for handling animations
func Router(r chi.Router) {
	r.Get("/", list)

	r.Put("/{id}", upsert)
	r.Delete("/{id}", remove)
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

// Delete an animation from the database
func remove(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	actions := rpc.GetActions(r.Context())

	actions <- rpc.NewRemoveAnimation(id)
	handlers.Respond(w)
}
