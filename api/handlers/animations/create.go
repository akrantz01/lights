package animations

import (
	"io/ioutil"
	"net/http"

	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Create a new animation
func create(w http.ResponseWriter, r *http.Request) {
	actions := rpc.GetActions(r.Context())
	db := database.GetDatabase(r.Context())
	l := logging.GetLogger(r.Context(), "animations:create")

	// Get the name and file
	name := r.FormValue("name")
	if name == "" {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("name must be present"))
		return
	}
	file, err := handlers.OpenFormFile(r, "wasm")
	if err == http.ErrMissingFile {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("wasm file must be present"))
		return
	} else if err != nil {
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

	animation := database.Animation{
		Name: name,
	}
	database.GenerateId(&animation)

	// Trigger the create action and wait for response
	method, success := rpc.NewAddAnimation(animation.Id, wasm)
	actions <- method
	if !<-success {
		handlers.Respond(w, handlers.WithStatus(400), handlers.WithError("invalid WASM payload"))
		return
	}

	// Insert into database
	if err := db.AddAnimation(animation); err != nil {
		handlers.Respond(w, handlers.AsFatal())
		l.Error("failed to insert into database", zap.Error(err))
		return
	}

	handlers.Respond(w)
}
