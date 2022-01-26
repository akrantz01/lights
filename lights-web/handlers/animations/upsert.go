package animations

import (
	"io/ioutil"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// The body containing the fields that are allowed to be updated
type animationUpsert struct {
	Name string `json:"name"`
	Wasm string `json:"wasm"`
}

// Update/create an animation
func upsert(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	actions := rpc.GetActions(r.Context())

	// Limit uploads to 10MB
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid form data"))
		return
	}

	// Open the WASM file
	file, _, err := r.FormFile("wasm")
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("animations:upsert").Error("failed to open form file", zap.Error(err), zap.String("name", name))
		return
	}
	defer file.Close()

	// Read the file
	wasm, err := ioutil.ReadAll(file)
	if err != nil {
		handlers.Respond(w, handlers.AsFatal())
		zap.L().Named("animations:upsert").Error("failed to read file", zap.Error(err), zap.String("name", name))
		return
	}

	// Trigger the action and wait for response
	method, success := rpc.NewAddAnimation(name, wasm)
	actions <- method

	if <-success {
		handlers.Respond(w)
	} else {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid WASM payload"))
	}
}
