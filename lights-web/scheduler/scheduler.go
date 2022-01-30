package scheduler

import (
	"time"

	"github.com/go-co-op/gocron"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/rpc"
)

type Scheduler struct {
	*gocron.Scheduler
	jobs map[string]*gocron.Job

	// dependencies
	db      *database.Database
	actions chan rpc.Callable
}

// New creates and starts a new scheduler using the given timezone
func New(timezoneName string, db *database.Database, actions chan rpc.Callable) (*Scheduler, error) {
	// Load the timezone and create the scheduler
	tz, err := time.LoadLocation(timezoneName)
	if err != nil {
		return nil, err
	}
	scheduler := &Scheduler{
		Scheduler: gocron.NewScheduler(tz),
		jobs:      make(map[string]*gocron.Job),
		db:        db,
		actions:   actions,
	}

	// Start the scheduler
	scheduler.StartAsync()
	zap.L().Named("scheduler").Info("started scheduler")

	return scheduler, nil
}

// Add creates a new scheduled job
func (s *Scheduler) Add(name, at string, repeats database.ScheduleRepeats) error {
	// Determine if we need to repeat this task
	if repeats == 0 {
		s.At(at).LimitRunsTo(1)
	} else {
		s.At(at).Every(1).Week()

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
	job, err := s.Do(handler, name, s.db, s.actions)
	if err != nil {
		return err
	}

	// Register the job by name
	s.jobs[name] = job

	return nil
}

// Remove removes a job by its schedule's name
func (s *Scheduler) Remove(name string) {
	if job, ok := s.jobs[name]; ok {
		s.RemoveByReference(job)
	}
}

// LoadFromDatabase fetches all the current schedules from the database and starts them
func (s *Scheduler) LoadFromDatabase() error {
	// Find all the schedules
	schedules, err := s.db.ListSchedules()
	if err != nil {
		return err
	}

	for _, name := range schedules {
		// Retrieve the schedule
		schedule, err := s.db.GetSchedule(name)
		if err != nil {
			return err
		}

		// Add the job
		if err := s.Add(name, schedule.At, schedule.Repeats); err != nil {
			return err
		}
	}

	zap.L().Named("schedules:load").Info("loaded all schedules")

	return nil
}
