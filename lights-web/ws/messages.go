package ws

import "github.com/akrantz01/lights/lights-web/database"

type MessageType uint8

const (
	// MessageConfiguration tells the client basic information about the current setup
	MessageConfiguration MessageType = iota + 1
	// MessageCurrentColor notifies clients of the current fill color. Once received by the client, the client shall
	// automatically switch to fill mode.
	MessageCurrentColor
	// MessageSetColor changes the fill color of the entire strip
	MessageSetColor
	// MessageStripState notifies clients of the current color and state of the strip
	MessageStripState
	// MessageStateOn turns on the entire strip to the last color
	MessageStateOn
	// MessageStateOff turns off the entire strip (equivalent to setting to 0,0,0)
	MessageStateOff
	// MessageCurrentBrightness notifies clients of the current brightness after a call to MessageSetBrightness
	MessageCurrentBrightness
	// MessageSetBrightness changes the current brightness of the lights
	MessageSetBrightness
	// MessageCurrentPixels notifies clients of changes to individual pixels on the strip. Once received by the client, the
	// client shall automatically switch to pixel modification mode.
	MessageCurrentPixels
	// MessageSetPixel is used to set an individual light to a given color
	MessageSetPixel
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

// CurrentBrightness is broadcast when the brightness changes
type CurrentBrightness struct {
	Type       MessageType `json:"type"`
	Brightness uint8       `json:"brightness"`
}

func NewCurrentBrightness(brightness uint8) CurrentBrightness {
	return CurrentBrightness{
		Type:       MessageCurrentBrightness,
		Brightness: brightness,
	}
}

// SetBrightness is received when a client wishes to change the brightness of the strip
type SetBrightness struct {
	Brightness uint8 `json:"brightness"`
}

// CurrentPixels is broadcast whenever any single pixels change
type CurrentPixels struct {
	Type    MessageType    `json:"type"`
	Indexes []uint16       `json:"indexes"`
	Color   database.Color `json:"color"`
}

func NewSingleCurrentPixels(index uint16, color database.Color) CurrentPixels {
	return CurrentPixels{
		Type:    MessageCurrentPixels,
		Indexes: []uint16{index},
		Color:   color,
	}
}

func NewCurrentPixels(indexes []uint16, color database.Color) CurrentPixels {
	return CurrentPixels{
		Type:    MessageCurrentPixels,
		Indexes: indexes,
		Color:   color,
	}
}

// SetPixel is received when a client wishes to change the color of an individual pixel
type SetPixel struct {
	Index uint16         `json:"index"`
	Color database.Color `json:"color"`
}
