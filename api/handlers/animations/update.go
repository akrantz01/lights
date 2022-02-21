package animations

import (
	"io/ioutil"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/events"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Update an animation
func update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	actions := rpc.GetActions(r.Context())
	db := database.GetDatabase(r.Context())
	emitter := events.GetEmitter(r.Context())
	l := logging.GetLogger(r.Context(), "animations:update").With(zap.String("id", id))

	// Get the animation
	animation, err := db.GetAnimation(id)
	if err == database.ErrNotFound {
		handlers.Respond(w, handlers.WithStatus(404), handlers.WithError("not found"))
		return
	} else if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to find animation", zap.Error(err))
		return
	}

	// Track the fields that were updated
	fields := make(map[string]interface{})

	// Update the name if exists
	if name := r.FormValue("name"); name != "" {
		animation.Name = name
		fields["name"] = name
	}

	// Open the WASM file
	file, err := handlers.OpenFormFile(r, "wasm")
	if err == nil {
		defer file.Close()

		// Read the file
		wasm, err := ioutil.ReadAll(file)
		if err != nil {
			handlers.Respond(w, handlers.AsFatal())
			l.Error("failed to read file", zap.Error(err))
			return
		}

		// Trigger the action and wait for response
		method, success := rpc.NewAddAnimation(id, wasm)
		actions <- method
		if !<-success {
			handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid WASM payload"))
			return
		}
	} else if err != nil && err != http.ErrMissingFile {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to open form file", zap.Error(err))
		return
	}

	// Update in the database
	if err := db.AddAnimation(animation); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to update in database", zap.Error(err))
		return
	}

	emitter.PublishAnimationUpdateEvent(animation.Id, fields)
	handlers.Respond(w)
}
