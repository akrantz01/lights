package database

type Color struct {
	Red   uint8 `json:"r"`
	Green uint8 `json:"g"`
	Blue  uint8 `json:"b"`
}

type Pixel struct {
	Index uint16
	Color Color
}
