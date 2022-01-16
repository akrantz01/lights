package ws

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan interface{}
	logger *zap.Logger
}

func newClient(conn *websocket.Conn, hub *Hub, logger *zap.Logger) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan interface{}),
		logger: logger,
	}
}

// register adds the client to hub
func (c *Client) register() {
	c.logger.Debug("registered new client")
	c.hub.register <- c
}

// reader processes all incoming messages from the client
func (c *Client) reader() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
		c.logger.Debug("unregistered client")
	}()

	// Set max message size and handle pongs
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		// Read message from connection
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if closeError, ok := err.(*websocket.CloseError); !ok {
				c.logger.Error("failed to read message", zap.Error(err))
			} else if closeError.Code == websocket.CloseNoStatusReceived || closeError.Code == websocket.CloseGoingAway {
				c.logger.Info("websocket connection closed")
			} else {
				c.logger.Error("connection closed unexpectedly", zap.Error(err))
			}
			break
		}

		// Determine the message type
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			c.logger.Error("failed to parse message", zap.Error(err))
			continue
		}

		// Re-parse the message and do stuff
		switch msg.Type {

		// Set the color of the entire light strip
		case MessageSetColor:
			var setColor SetColor
			if err := json.Unmarshal(message, &setColor); err != nil {
				c.logger.Error("failed to parse set color message")
				continue
			}

			// TODO: actually set the light strip color

			c.hub.broadcast <- NewCurrentColor(setColor.Color)

		case MessageStateOn:
			// TODO: actually set the strip to the last color

			c.hub.broadcast <- NewStripStatus(true)

		case MessageStateOff:
			// TODO: actually set the strip to off

			c.hub.broadcast <- NewStripStatus(false)

		// Set the brightness of the entire strip
		case MessageSetBrightness:
			var setBrightness SetBrightness
			if err := json.Unmarshal(message, &setBrightness); err != nil {
				c.logger.Error("failed to parse set brightness message", zap.Error(err))
				continue
			}

			if setBrightness.Brightness > 100 {
				c.logger.Warn("invalid brightness level", zap.Uint8("brightness", setBrightness.Brightness))
				continue
			}

			// TODO: actually set the strip brightness

			c.hub.broadcast <- NewCurrentBrightness(setBrightness.Brightness)

		// Handle any unknown messages
		default:
			c.logger.Warn("unknown message type", zap.Uint8("type", uint8(msg.Type)))
			break
		}
	}
}

// writer broadcasts all messages to the client
func (c *Client) writer() {
	// Keep connection alive
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		// Send the messages to be broadcast
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				c.logger.Debug("channel closed, terminating connection")
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				c.logger.Error("failed to send message", zap.Error(err))
				return
			}

		// Send pings at regular intervals
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.logger.Error("failed to send ping message", zap.Error(err))
				return
			}
		}
	}
}
