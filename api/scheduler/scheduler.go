package scheduler

import (
	"time"

	"github.com/go-co-op/gocron"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/rpc"
)

type Scheduler struct {
	*gocron.Scheduler
	jobs map[string]*gocron.Job

	// dependencies
	db          *database.Database
	actions     chan rpc.Callable
	broadcast   chan interface{}
	stripLength uint16
}

// New creates and starts a new scheduler using the given timezone
func New(
	timezoneName string,
	length uint16,
	db *database.Database,
	actions chan rpc.Callable,
	broadcast chan interface{},
) (*Scheduler, error) {
	// Load the timezone and create the scheduler
	tz, err := time.LoadLocation(timezoneName)
	if err != nil {
		return nil, err
	}
	scheduler := &Scheduler{
		Scheduler:   gocron.NewScheduler(tz),
		jobs:        make(map[string]*gocron.Job),
		db:          db,
		actions:     actions,
		broadcast:   broadcast,
		stripLength: length,
	}

	// Start the scheduler
	scheduler.StartAsync()
	zap.L().Named("scheduler").Info("started scheduler")

	return scheduler, nil
}

// Add creates a new scheduled job
func (s *Scheduler) Add(id, at string, repeats database.ScheduleRepeats) error {
	// Determine if we need to repeat this task
	if repeats == 0 {
		s.Every(1).Day().At(at).LimitRunsTo(1)
	} else {
		s.Every(1).Week().At(at)

		// Set the days of the week that should be repeated
		if repeats&database.ScheduleRepeatsSunday == database.ScheduleRepeatsSunday {
			s.Sunday()
		}
		if repeats&database.ScheduleRepeatsMonday == database.ScheduleRepeatsMonday {
			s.Monday()
		}
		if repeats&database.ScheduleRepeatsTuesday == database.ScheduleRepeatsTuesday {
			s.Tuesday()
		}
		if repeats&database.ScheduleRepeatsWednesday == database.ScheduleRepeatsWednesday {
			s.Wednesday()
		}
		if repeats&database.ScheduleRepeatsThursday == database.ScheduleRepeatsThursday {
			s.Thursday()
		}
		if repeats&database.ScheduleRepeatsFriday == database.ScheduleRepeatsFriday {
			s.Friday()
		}
		if repeats&database.ScheduleRepeatsSaturday == database.ScheduleRepeatsSaturday {
			s.Saturday()
		}
	}

	// Create the job
	job, err := s.Do(handler, id, s.db, s.actions, s.broadcast)
	if err != nil {
		return err
	}

	// Register the job by id
	s.jobs[id] = job

	return nil
}

// Remove removes a job by its id
func (s *Scheduler) Remove(id string) {
	if job, ok := s.jobs[id]; ok {
		s.RemoveByReference(job)
		delete(s.jobs, id)
	}
}

// IsScheduled gets whether a job is scheduled to run by its id
func (s *Scheduler) IsScheduled(id string) bool {
	_, ok := s.jobs[id]
	return ok
}

// LoadFromDatabase fetches all the current schedules from the database and starts them
func (s *Scheduler) LoadFromDatabase() error {
	// Find all the schedules
	schedules, err := s.db.ListSchedules()
	if err != nil {
		return err
	}

	// Add all the schedules
	for _, schedule := range schedules {
		// Skip all disabled schedules
		if !schedule.Enabled {
			continue
		}

		if err := s.Add(schedule.ID, schedule.At, schedule.Repeats); err != nil {
			return err
		}
	}

	zap.L().Named("schedules:load").Info("loaded all schedules", zap.Int("count", len(schedules)))

	return nil
}
