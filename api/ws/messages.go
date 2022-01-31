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
	// MessageModifiedPixels notifies clients of changes to individual pixels on the strip. Once received by the client, the
	// client shall automatically switch to pixel modification mode.
	MessageModifiedPixels
	// MessageSetPixel is used to set an individual light to a given color
	MessageSetPixel
	// MessageSetRange is used to set a range of pixels to a given color
	MessageSetRange
	// MessageSetArbitrary is used to set arbitrary pixels to a given color
	MessageSetArbitrary
	// MessageCurrentPixels notifies clients of the current individual pixel colors when the strip is in pixel
	// modification mode.
	MessageCurrentPixels
	// MessagePresetUsed notifies clients that a preset was applied to the strip
	MessagePresetUsed
	// MessageApplyPreset displays a preset onto the strip
	MessageApplyPreset
	// MessageAnimationStatus notifies clients about the current animation state
	MessageAnimationStatus
	// MessageStartAnimation is used to start an animation by name
	MessageStartAnimation
	// MessageStopAnimation is used to stop the current animation (if it's running)
	MessageStopAnimation
)

// Message is used to determine the type of message to decode as
type Message struct {
	Type MessageType `json:"type"`
}

// Configuration describes basic information about the server
type Configuration struct {
	Type        MessageType `json:"type"`
	StripLength uint16      `json:"strip_length"`
}

func NewConfiguration(length uint16) Configuration {
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

// ModifiedPixels is broadcast whenever any single pixels change
type ModifiedPixels struct {
	Type    MessageType    `json:"type"`
	Indexes []uint16       `json:"indexes"`
	Color   database.Color `json:"color"`
}

func NewSingleModifiedPixel(index uint16, color database.Color) ModifiedPixels {
	return ModifiedPixels{
		Type:    MessageModifiedPixels,
		Indexes: []uint16{index},
		Color:   color,
	}
}

func NewModifiedPixels(indexes []uint16, color database.Color) ModifiedPixels {
	return ModifiedPixels{
		Type:    MessageModifiedPixels,
		Indexes: indexes,
		Color:   color,
	}
}

// SetPixel is received when a client wishes to change the color of an individual pixel
type SetPixel struct {
	Index uint16         `json:"index"`
	Color database.Color `json:"color"`
}

// SetPixelRange is received when a client wishes to change the color of a range of pixels
type SetPixelRange struct {
	Start uint16         `json:"start"`
	End   uint16         `json:"end"`
	Color database.Color `json:"color"`
}

// SetArbitraryPixels is received when a client wishes to change the color of individual, non-linear pixels
type SetArbitraryPixels struct {
	Indexes []uint16       `json:"indexes"`
	Color   database.Color `json:"color"`
}

// CurrentPixels is used to broadcast the status of all pixels
type CurrentPixels struct {
	Type   MessageType      `json:"type"`
	Pixels []database.Color `json:"pixels"`
}

func NewCurrentPixels(pixels []database.Color) CurrentPixels {
	return CurrentPixels{
		Type:   MessageCurrentPixels,
		Pixels: pixels,
	}
}

// PresetUsed is used to broadcast the name of the preset that was applied
type PresetUsed struct {
	Type MessageType `json:"type"`
	Name string      `json:"name"`
}

func NewPresetUsed(name string) PresetUsed {
	return PresetUsed{
		Type: MessagePresetUsed,
		Name: name,
	}
}

// ApplyPreset is received when a client wishes to apply a preset to the strip
type ApplyPreset struct {
	Name string `json:"name"`
}

// AnimationStatus is used to broadcast the current status of the animation. When an animation is stopped, the name
// is populated with an empty string.
type AnimationStatus struct {
	Type    MessageType `json:"type"`
	Name    string      `json:"name"`
	Running bool        `json:"running"`
}

func NewAnimationStatus(name string, running bool) AnimationStatus {
	return AnimationStatus{
		Type:    MessageAnimationStatus,
		Name:    name,
		Running: running,
	}
}

// StartAnimation is received when a client wishes to run a registered animation
type StartAnimation struct {
	Name string
}
