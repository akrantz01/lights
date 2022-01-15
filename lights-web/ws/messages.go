package ws

import "github.com/akrantz01/lights/lights-web/database"

type MessageType uint8

const (
	// MessageConfiguration tells the client basic information about the current setup
	MessageConfiguration MessageType = iota + 1
	// MessageCurrentColor notifies clients of the current color after a call to SetColor
	MessageCurrentColor
	// MessageSetColor changes the current color of the lights
	MessageSetColor
	// MessageStripState notifies clients of the current color and state of the strip
	MessageStripState
	// MessageStateOn turns on the entire strip to the last color
	MessageStateOn
	// MessageStateOff turns off the entire strip (equivalent to setting to 0,0,0)
	MessageStateOff
)

// Message is used to determine the type of message to decode as
type Message struct {
	Type MessageType `json:"type"`
}

// Configuration describes basic information about the server
type Configuration struct {
	Type        MessageType `json:"type"`
	StripLength int         `json:"strip_length"`
}

func NewConfiguration(length int) Configuration {
	return Configuration{
		Type:        MessageConfiguration,
		StripLength: length,
	}
}

// CurrentColor is broadcast when the color of the strip changes
type CurrentColor struct {
	Type  MessageType    `json:"type"`
	Color database.Color `json:"color"`
}

func NewCurrentColor(color database.Color) CurrentColor {
	return CurrentColor{
		Type:  MessageCurrentColor,
		Color: color,
	}
}

// SetColor is received when a client wishes to change the color of the entire strip
type SetColor struct {
	Color database.Color `json:"color"`
}

// StripState is broadcast when the state of the strip changes
type StripState struct {
	Type MessageType `json:"type"`
	On   bool        `json:"on"`
}

func NewStripStatus(on bool) StripState {
	return StripState{
		Type: MessageStripState,
		On:   on,
	}
}
