package animations

import (
	"io/ioutil"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Update/create an animation
func upsert(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	actions := rpc.GetActions(r.Context())
	l := logging.GetLogger(r.Context(), "animations:upsert").With(zap.String("slug", slug))

	// Limit uploads to 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid form data"))
		return
	}

	// Open the WASM file
	file, _, err := r.FormFile("wasm")
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to open form file", zap.Error(err))
		return
	}
	defer file.Close()

	// Read the file
	wasm, err := ioutil.ReadAll(file)
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to read file", zap.Error(err))
		return
	}

	// Trigger the action and wait for response
	method, success := rpc.NewAddAnimation(slug, wasm)
	actions <- method

	if <-success {
		handlers.Respond(w)
	} else {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid WASM payload"))
	}
}
