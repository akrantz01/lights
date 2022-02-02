package ws

import "github.com/akrantz01/lights/lights-web/database"

type MessageType string

const (
	// MessageConfiguration tells the client basic information about the current setup
	MessageConfiguration MessageType = "strip/setLength"
	// MessageCurrentColor notifies clients of the current fill color. Once received by the client, the client shall
	// automatically switch to fill mode.
	MessageCurrentColor = "display/setFill"
	// MessageSetColor changes the fill color of the entire strip
	MessageSetColor = "server/display/setColor"
	// MessageStripState notifies clients of the current color and state of the strip
	MessageStripState = "strip/setState"
	// MessageStateOn turns on the entire strip to the last color
	MessageStateOn = "server/strip/on"
	// MessageStateOff turns off the entire strip (equivalent to setting to 0,0,0)
	MessageStateOff = "server/strip/off"
	// MessageCurrentBrightness notifies clients of the current brightness after a call to MessageSetBrightness
	MessageCurrentBrightness = "strip/setBrightness"
	// MessageSetBrightness changes the current brightness of the lights
	MessageSetBrightness = "server/strip/setBrightness"
	// MessageModifiedPixels notifies clients of changes to individual pixels on the strip. Once received by the client, the
	// client shall automatically switch to pixel modification mode.
	MessageModifiedPixels = "display/setPixelsByIndex"
	// MessageSetPixel is used to set an individual light to a given color
	MessageSetPixel = "server/display/setPixel"
	// MessageSetRange is used to set a range of pixels to a given color
	MessageSetRange = "server/display/setPixelRange"
	// MessageSetArbitrary is used to set arbitrary pixels to a given color
	MessageSetArbitrary = "server/display/setArbitraryPixels"
	// MessageCurrentPixels notifies clients of the current individual pixel colors when the strip is in pixel
	// modification mode.
	MessageCurrentPixels = "display/setAllPixels"
	// MessagePresetUsed notifies clients that a preset was applied to the strip
	MessagePresetUsed = "display/setPreset"
	// MessageApplyPreset displays a preset onto the strip
	MessageApplyPreset = "server/display/applyPreset"
	// MessageAnimationStarted notifies clients the currently running animation
	MessageAnimationStarted = "display/startAnimation"
	// MessageStartAnimation is used to start an animation by name
	MessageStartAnimation = "server/display/startAnimation"
	// MessageAnimationStopped notifies clients that the animation was stopped
	MessageAnimationStopped = "display/stopAnimation"
	// MessageStopAnimation is used to stop the current animation (if it's running)
	MessageStopAnimation = "server/display/stopAnimation"
)

// Message is used to determine the type of message to decode as
// TODO: Once Go 1.18 is released, this can be made generic and the *Payload variants can be removed
type Message struct {
	Type MessageType `json:"type"`
}

// Configuration describes basic information about the server
type Configuration struct {
	Type    MessageType `json:"type"`
	Payload uint16      `json:"payload"`
}

func NewConfiguration(length uint16) Configuration {
	return Configuration{
		Type:    MessageConfiguration,
		Payload: length,
	}
}

// CurrentColor is broadcast when the color of the strip changes
type CurrentColor struct {
	Type    MessageType    `json:"type"`
	Payload database.Color `json:"payload"`
}

func NewCurrentColor(color database.Color) CurrentColor {
	return CurrentColor{
		Type:    MessageCurrentColor,
		Payload: color,
	}
}

// SetColor is received when a client wishes to change the color of the entire strip
type SetColor struct {
	Color database.Color `json:"payload"`
}

// StripState is broadcast when the state of the strip changes
type StripState struct {
	Type    MessageType `json:"type"`
	Payload bool        `json:"payload"`
}

func NewStripStatus(on bool) StripState {
	return StripState{
		Type:    MessageStripState,
		Payload: on,
	}
}

// CurrentBrightness is broadcast when the brightness changes
type CurrentBrightness struct {
	Type    MessageType `json:"type"`
	Payload uint8       `json:"payload"`
}

func NewCurrentBrightness(brightness uint8) CurrentBrightness {
	return CurrentBrightness{
		Type:    MessageCurrentBrightness,
		Payload: brightness,
	}
}

// SetBrightness is received when a client wishes to change the brightness of the strip
type SetBrightness struct {
	Brightness uint8 `json:"payload"`
}

// ModifiedPixels is broadcast whenever any single pixels change
type ModifiedPixels struct {
	Type    MessageType           `json:"type"`
	Payload ModifiedPixelsPayload `json:"payload"`
}
type ModifiedPixelsPayload struct {
	Indexes []uint16       `json:"indexes"`
	Color   database.Color `json:"color"`
}

func NewSingleModifiedPixel(index uint16, color database.Color) ModifiedPixels {
	return ModifiedPixels{
		Type: MessageModifiedPixels,
		Payload: ModifiedPixelsPayload{
			Indexes: []uint16{index},
			Color:   color,
		},
	}
}

func NewModifiedPixels(indexes []uint16, color database.Color) ModifiedPixels {
	return ModifiedPixels{
		Type: MessageModifiedPixels,
		Payload: ModifiedPixelsPayload{
			Indexes: indexes,
			Color:   color,
		},
	}
}

// SetPixel is received when a client wishes to change the color of an individual pixel
type SetPixel struct {
	Payload struct {
		Index uint16         `json:"index"`
		Color database.Color `json:"color"`
	} `json:"payload"`
}

// SetPixelRange is received when a client wishes to change the color of a range of pixels
type SetPixelRange struct {
	Payload struct {
		Start uint16         `json:"start"`
		End   uint16         `json:"end"`
		Color database.Color `json:"color"`
	} `json:"payload"`
}

// SetArbitraryPixels is received when a client wishes to change the color of individual, non-linear pixels
type SetArbitraryPixels struct {
	Payload struct {
		Indexes []uint16       `json:"indexes"`
		Color   database.Color `json:"color"`
	} `json:"payload"`
}

// CurrentPixels is used to broadcast the status of all pixels
type CurrentPixels struct {
	Type    MessageType      `json:"type"`
	Payload []database.Color `json:"payload"`
}

func NewCurrentPixels(pixels []database.Color) CurrentPixels {
	return CurrentPixels{
		Type:    MessageCurrentPixels,
		Payload: pixels,
	}
}

// PresetUsed is used to broadcast the name of the preset that was applied
type PresetUsed struct {
	Type    MessageType `json:"type"`
	Payload string      `json:"payload"`
}

func NewPresetUsed(name string) PresetUsed {
	return PresetUsed{
		Type:    MessagePresetUsed,
		Payload: name,
	}
}

// ApplyPreset is received when a client wishes to apply a preset to the strip
type ApplyPreset struct {
	Name string `json:"payload"`
}

// AnimationStarted is used to broadcast the newly started animation
type AnimationStarted struct {
	Type    MessageType `json:"type"`
	Payload string      `json:"payload"`
}

func NewAnimationStarted(name string) AnimationStarted {
	return AnimationStarted{
		Type:    MessageAnimationStarted,
		Payload: name,
	}
}

// StartAnimation is received when a client wishes to run a registered animation
type StartAnimation struct {
	Name string `json:"payload"`
}

// AnimationStopped is used to broadcast that the current animation was stopped
type AnimationStopped struct {
	Type MessageType `json:"type"`
}

func NewAnimationStopped() AnimationStopped {
	return AnimationStopped{
		Type: MessageAnimationStopped,
	}
}
