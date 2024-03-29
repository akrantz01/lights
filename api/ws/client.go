package ws

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/auth"
	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/rpc"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1 << 11
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
func (c *Client) reader(actions chan rpc.Callable, db *database.Database, stripLength uint16, v *validator.Validator) {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
		c.logger.Debug("unregistered client")
	}()

	// Set max message size and handle pongs
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Store the user's permissions
	permissions := new(auth.Permissions)

	for {
		// Read message from connection
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			var closeError *websocket.CloseError
			if ok := errors.As(err, &closeError); !ok {
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

		// Prevent any actions if the user does not have permissions to control the lights
		if msg.Type != MessageLogin && msg.Type != MessageLogout && !permissions.Has(auth.PermissionControlLights) {
			c.send <- NewPermissionsError(auth.PermissionControlLights)
			continue
		}

		// Re-parse the message and do stuff
		//nolint:exhaustive
		switch msg.Type {
		// Attempt to log the user in
		case MessageLogin:
			var login Login
			if err := json.Unmarshal(message, &login); err != nil {
				c.logger.Error("failed to parse login message")
				continue
			}

			// Check that the token is valid and notify the client of their permissions
			validatedClaims, err := v.ValidateToken(context.Background(), login.Token)
			if err != nil {
				c.logger.Warn("invalid authentication token", zap.Error(err))
				c.send <- NewAuthenticationStatus([]string{})
			} else {
				claims := validatedClaims.(*validator.ValidatedClaims).CustomClaims.(*auth.CustomClaims)
				permissions = auth.NewPermissions(claims.Permissions)
				c.send <- NewAuthenticationStatus(permissions.AsSlice())
			}

		// Logout the user
		case MessageLogout:
			permissions = nil
			c.send <- NewAuthenticationStatus([]string{})

		// Set the color of the entire light strip
		case MessageSetColor:
			var setColor SetColor
			if err := json.Unmarshal(message, &setColor); err != nil {
				c.logger.Error("failed to parse set color message")
				continue
			}

			actions <- rpc.NewColorChange(setColor.Color)
			c.hub.broadcast <- NewFilledPixels(setColor.Color, stripLength)

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

		// Sets an arbitrary set of pixels to the same color
		case MessageSetPixels:
			var setArbitrary SetArbitraryPixels
			if err := json.Unmarshal(message, &setArbitrary); err != nil {
				c.logger.Error("failed to parse set arbitrary pixels message", zap.Error(err))
				continue
			}

			if len(setArbitrary.Payload.Indexes) == 0 || setArbitrary.Payload.Indexes == nil {
				c.logger.Warn("no indexes to set")
				continue
			}

			actions <- rpc.NewSetPixels(setArbitrary.Payload.Indexes, setArbitrary.Payload.Color)
			c.hub.broadcast <- NewModifiedPixels(setArbitrary.Payload.Indexes, setArbitrary.Payload.Color)

		// Apply a preset to the strip
		case MessageApplyPreset:
			var applyPreset ApplyPreset
			if err := json.Unmarshal(message, &applyPreset); err != nil {
				c.logger.Error("failed to parse apply preset message", zap.Error(err))
				continue
			}

			// Fetch the preset
			preset, err := db.GetPreset(applyPreset.ID)
			if errors.Is(err, database.ErrNotFound) {
				c.send <- NewNotFoundError(fmt.Sprintf("preset '%s'", applyPreset.ID))
				continue
			} else if err != nil {
				c.logger.Error("failed to find preset", zap.Error(err), zap.String("id", applyPreset.ID))
				continue
			}

			actions <- rpc.NewApplyPreset(preset)
			c.hub.broadcast <- NewPresetUsed(preset)
			c.hub.broadcast <- NewCurrentBrightness(preset.Brightness)
			c.hub.broadcast <- NewStripStatus(true)

		// Start an animation by name on the strip
		case MessageStartAnimation:
			var startAnimation StartAnimation
			if err := json.Unmarshal(message, &startAnimation); err != nil {
				c.logger.Error("failed to parse start animation message", zap.Error(err))
				continue
			}

			// Ensure the animation exists
			animation, err := db.GetAnimation(startAnimation.ID)
			if errors.Is(err, database.ErrNotFound) {
				c.send <- NewNotFoundError(fmt.Sprintf("animation '%s'", startAnimation.ID))
				continue
			} else if err != nil {
				c.logger.Error("failed to find animation", zap.Error(err), zap.String("id", startAnimation.ID))
				continue
			}

			actions <- rpc.NewStartAnimation(animation.ID)
			c.hub.broadcast <- NewAnimationStarted(animation.ID)

		// Stop the currently running animation
		case MessageStopAnimation:
			actions <- rpc.NewStopAnimation()
			c.hub.broadcast <- NewAnimationStopped()

		// Handle any unknown messages
		default:
			c.logger.Warn("unknown message type", zap.String("type", string(msg.Type)))
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
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				c.logger.Debug("channel closed, terminating connection")
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				c.logger.Error("failed to send message", zap.Error(err))
				return
			}

		// Send pings at regular intervals
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.logger.Error("failed to send ping message", zap.Error(err))
				return
			}
		}
	}
}
