package ws

import (
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/rpc"
	"github.com/akrantz01/lights/lights-web/util"
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
func (c *Client) reader(actions chan rpc.Callable) {
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

			actions <- rpc.NewColorChange(setColor.Color)
			c.hub.broadcast <- NewCurrentColor(setColor.Color)

		// Turn the entire strip on
		case MessageStateOn:
			actions <- rpc.NewStateChange(true)
			c.hub.broadcast <- NewStripStatus(true)

		// Turn the entire strip off
		case MessageStateOff:
			actions <- rpc.NewStateChange(false)
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

			actions <- rpc.NewBrightnessChange(setBrightness.Brightness)
			c.hub.broadcast <- NewCurrentBrightness(setBrightness.Brightness)

		// Sets the color of an individual pixel
		case MessageSetPixel:
			var setPixel SetPixel
			if err := json.Unmarshal(message, &setPixel); err != nil {
				c.logger.Error("failed to parse set pixel message", zap.Error(err))
				continue
			}

			actions <- rpc.NewSetPixel(setPixel.Index, setPixel.Color)
			c.hub.broadcast <- NewSingleModifiedPixel(setPixel.Index, setPixel.Color)

		// Sets the color of a range of pixels
		case MessageSetRange:
			var setRange SetPixelRange
			if err := json.Unmarshal(message, &setRange); err != nil {
				c.logger.Error("failed to parse set pixel range message", zap.Error(err))
				continue
			}

			// Determine the range of all pixels modified
			modified := util.RangeToIndexes(setRange.Start, setRange.End)

			actions <- rpc.NewPixelRange(setRange.Start, setRange.End, setRange.Color)
			c.hub.broadcast <- NewModifiedPixels(modified, setRange.Color)

		// Sets an arbitrary set of pixels to the same color
		case MessageSetArbitrary:
			var setArbitrary SetArbitraryPixels
			if err := json.Unmarshal(message, &setArbitrary); err != nil {
				c.logger.Error("failed to parse set arbitrary pixels message", zap.Error(err))
				continue
			}

			if len(setArbitrary.Indexes) == 0 || setArbitrary.Indexes == nil {
				c.logger.Warn("no indexes to set")
				continue
			}

			actions <- rpc.NewArbitraryPixels(setArbitrary.Indexes, setArbitrary.Color)
			c.hub.broadcast <- NewModifiedPixels(setArbitrary.Indexes, setArbitrary.Color)

		// Apply a preset to the strip
		case MessageApplyPreset:
			var applyPreset ApplyPreset
			if err := json.Unmarshal(message, &applyPreset); err != nil {
				c.logger.Error("failed to parse apply preset message", zap.Error(err))
				continue
			}

			actions <- rpc.NewApplyPreset(applyPreset.Name)
			c.hub.broadcast <- NewPresetUsed(applyPreset.Name)

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
