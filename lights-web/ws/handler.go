package ws

import (
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Handler initiates the websocket connection and starts the client
func Handler(hub *Hub, stripLength uint16) func(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		ReadBufferSize:    1024,
		WriteBufferSize:   1024,
		EnableCompression: true,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		id := middleware.GetReqID(r.Context())
		logger := zap.L().With(zap.String("id", id), zap.String("remote", r.RemoteAddr))

		actions := rpc.GetActions(r.Context())
		db := database.GetDatabase(r.Context())

		// Create the client
		client := newClient(conn, hub, logger)
		client.register()

		// Start reader and writer routines
		go client.reader(actions)
		go client.writer()

		// Send configuration information
		client.send <- NewConfiguration(stripLength)

		// Get the current status
		brightness, err := db.GetBrightness()
		if err != nil {
			logger.Error("failed to get brightness", zap.Error(err))
		}
		color, err := db.GetColor()
		if err != nil {
			logger.Error("failed to get color", zap.Error(err))
		}
		state, err := db.GetState()
		if err != nil {
			logger.Error("failed to get state", zap.Error(err))
		}

		client.send <- NewCurrentBrightness(brightness)
		client.send <- NewCurrentColor(color)
		client.send <- NewStripStatus(state)
	}
}
