package ws

type MessageType uint8

// Message is used to determine the type of message to decode as
type Message struct {
	Type MessageType `json:"type"`
}
