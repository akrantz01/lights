package ws

import (
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/handlers"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// Handler initiates the websocket connection and starts the client
func Handler(hub *Hub) func(w http.ResponseWriter, r *http.Request) {
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
		length := handlers.GetStripLength(r.Context())
		client.send <- NewConfiguration(length)

		// Get the current status for state and brightness
		brightness, err := db.GetBrightness()
		if err != nil {
			logger.Error("failed to get brightness", zap.Error(err))
		}
		client.send <- NewCurrentBrightness(brightness)
		state, err := db.GetState()
		if err != nil {
			logger.Error("failed to get state", zap.Error(err))
		}
		client.send <- NewStripStatus(state)

		// Get the current display mode
		if mode, err := db.GetPixelMode(); err != nil {
			logger.Error("failed to get pixel state")
		} else if mode == database.PixelModeFill {
			color, err := db.GetColor()
			if err != nil {
				logger.Error("failed to get color", zap.Error(err))
			}

			client.send <- NewCurrentColor(color)
		} else if mode == database.PixelModeIndividual {
			pixels, err := db.GetPixels()
			if err != nil {
				logger.Error("failed to get pixel colors", zap.Error(err))
			}

			client.send <- NewCurrentPixels(pixels)
		} else if mode == database.PixelModeAnimation {
			animation, err := db.GetCurrentAnimation()
			if err != nil {
				logger.Error("failed to get current animation", zap.Error(err))
			}

			if len(animation) != 0 {
				client.send <- NewAnimationStarted(animation)
			} else {
				client.send <- NewAnimationStopped()
			}
		}
	}
}
