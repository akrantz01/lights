package database

type Animation struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type Color struct {
	Red   uint8 `json:"r"`
	Green uint8 `json:"g"`
	Blue  uint8 `json:"b"`
}

type Preset struct {
	Id         string  `json:"id"`
	Name       string  `json:"name"`
	Pixels     []Color `json:"pixels"`
	Brightness uint8   `json:"brightness"`
}

type PartialPreset struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type PartialSchedule struct {
	Id      string          `json:"id"`
	Name    string          `json:"name"`
	At      string          `json:"at"`
	Repeats ScheduleRepeats `json:"repeats"`
}

type Schedule struct {
	Id        string          `json:"id"`
	Name      string          `json:"name"`
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
