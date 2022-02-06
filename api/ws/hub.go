package ws

import (
	"context"

	"go.uber.org/zap"
)

type Hub struct {
	ctx    context.Context
	cancel context.CancelFunc

	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
}

// NewHub creates and starts a new client hub
func NewHub() *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	hub := &Hub{
		ctx:        ctx,
		cancel:     cancel,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan interface{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}

	go hub.run()

	return hub
}

// Broadcast gets the broadcast channel
func (h *Hub) Broadcast() chan interface{} {
	return h.broadcast
}

// run starts processing client registration and message broadcasting
func (h *Hub) run() {
	logger := zap.L().Named("hub")
	logger.Info("started hub...")

	for {
		select {
		// Register a new client
		case client := <-h.register:
			logger.Debug("registered new client")
			h.clients[client] = true

		// Unregister a client & close the connection
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			logger.Debug("unregistered client, if exists")

		// Send the message to all clients
		case message := <-h.broadcast:
			for client := range h.clients {
				// Attempt to send the message, closing the connection on failure
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}

		case <-h.ctx.Done():
			return
		}
	}
}

// Stop stops the hub
func (h *Hub) Stop() {
	zap.L().Named("hub").Info("shutting down...")

	h.cancel()

	for client := range h.clients {
		close(client.send)
	}
}
