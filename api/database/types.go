package database

type Animation struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Color struct {
	Red   uint8 `json:"r"`
	Green uint8 `json:"g"`
	Blue  uint8 `json:"b"`
}

type Preset struct {
	Name       string  `json:"name"`
	Slug       string  `json:"slug"`
	Pixels     []Color `json:"pixels"`
	Brightness uint8   `json:"brightness"`
}

type PartialPreset struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Schedule struct {
	Name      string          `json:"name"`
	Slug      string          `json:"slug"`
	At        string          `json:"at"`
	Repeats   ScheduleRepeats `json:"repeats"`
	Type      ScheduleType    `json:"type"`
	Color     *Color          `json:"color"`
	Preset    *string         `json:"preset"`
	Animation *string         `json:"animation"`
}

type ScheduleType uint8

const (
	ScheduleTypeFill ScheduleType = iota + 1
	ScheduleTypePreset
	ScheduleTypeAnimation
)

type ScheduleRepeats uint8

const (
	ScheduleRepeatsSunday ScheduleRepeats = 1 << iota
	ScheduleRepeatsMonday
	ScheduleRepeatsTuesday
	ScheduleRepeatsWednesday
	ScheduleRepeatsThursday
	ScheduleRepeatsFriday
	ScheduleRepeatsSaturday
)
