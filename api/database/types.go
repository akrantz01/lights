package database

type AnimationType int32

const (
	AnimationTypeWasm AnimationType = iota + 1
	AnimationTypeFlow
)

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

// AsPartial converts a full preset into its partial representation
func (p Preset) AsPartial() PartialPreset {
	return PartialPreset{
		Id:   p.Id,
		Name: p.Name,
	}
}

type PartialPreset struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type PartialSchedule struct {
	Id      string          `json:"id"`
	Name    string          `json:"name"`
	Enabled bool            `json:"enabled"`
	At      string          `json:"at"`
	Repeats ScheduleRepeats `json:"repeats"`
}

type Schedule struct {
	Id        string          `json:"id"`
	Name      string          `json:"name"`
	Enabled   bool            `json:"enabled"`
	At        string          `json:"at"`
	Repeats   ScheduleRepeats `json:"repeats"`
	Type      ScheduleType    `json:"type"`
	Color     *Color          `json:"color"`
	Preset    *string         `json:"preset"`
	Animation *string         `json:"animation"`
}

// AsPartial converts a full schedule into its partial representation
func (s Schedule) AsPartial() PartialSchedule {
	return PartialSchedule{
		Id:      s.Id,
		Name:    s.Name,
		Enabled: s.Enabled,
		At:      s.At,
		Repeats: s.Repeats,
	}
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
