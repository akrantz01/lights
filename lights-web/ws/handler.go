package ws

import (
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Handler initiates the websocket connection and starts the client
func Handler(hub *Hub, stripLength int) func(w http.ResponseWriter, r *http.Request) {
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

		// Create the client
		client := newClient(conn, hub, logger)
		client.register()

		// Start reader and writer routines
		go client.reader()
		go client.writer()

		// Send configuration information
		client.send <- NewConfiguration(stripLength)

		// TODO: send current strip state and color
	}
}
