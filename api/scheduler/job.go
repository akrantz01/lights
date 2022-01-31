package scheduler

import (
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/rpc"
)

// handler is the function that gets run when executing a schedule
func handler(name string, db *database.Database, actions chan rpc.Callable) {
	logger := zap.L().Named("scheduler:handler").With(zap.String("schedule", name))

	// Get the schedule
	schedule, err := db.GetSchedule(name)
	if err == database.ErrNotFound {
		logger.Warn("schedule no longer exists")
		return
	} else if err != nil {
		logger.Error("failed to get schedule from database", zap.Error(err))
		return
	}

	// Execute the schedule
	switch schedule.Type {
	case database.ScheduleTypeFill:
		actions <- rpc.NewColorChange(*schedule.Color)
	case database.ScheduleTypePreset:
		actions <- rpc.NewApplyPreset(*schedule.Preset)
	case database.ScheduleTypeAnimation:
		actions <- rpc.NewStartAnimation(*schedule.Animation)
	}

	logger.Debug("execution finished")
}
