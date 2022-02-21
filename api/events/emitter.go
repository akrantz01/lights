package events

import (
	"net/http"

	"github.com/r3labs/sse/v2"
)

const (
	animationStream = "animation"
	presetStream    = "preset"
	scheduleStream  = "schedule"
)

type Emitter struct {
	server  *sse.Server
	Handler http.HandlerFunc
}

// Close shuts down the server and closes all streams/connections
func (e *Emitter) Close() {
	e.server.Close()
}

// New creates a new event emitter
func New() *Emitter {
	server := sse.New()

	// Create streams for each handler
	server.CreateStream(animationStream)
	server.CreateStream(presetStream)
	server.CreateStream(scheduleStream)

	return &Emitter{
		server:  server,
		Handler: server.ServeHTTP,
	}
}
