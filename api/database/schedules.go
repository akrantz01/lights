package database

import (
	"strings"

	"github.com/dgraph-io/badger/v3"
	"go.mongodb.org/mongo-driver/bson"
)

const schedulePrefix = "schedule-"

// ListSchedules gets a list of all schedules in the database
func (d *Database) ListSchedules() ([]PartialSchedule, error) {
	var schedules []PartialSchedule

	err := d.db.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()

		// Iterate over all keys
		for iterator.Rewind(); iterator.Valid(); iterator.Next() {
			item := iterator.Item()
			key := string(item.Key())

			// Add only if it is preset
			if strings.HasPrefix(key, schedulePrefix) {
				value, err := item.ValueCopy(nil)
				if err != nil {
					return err
				}

				var schedule PartialSchedule
				if err := bson.Unmarshal(value, &schedule); err != nil {
					return err
				}

				schedules = append(schedules, schedule)
			}
		}

		return nil
	})
	return schedules, err
}

// AddSchedule inserts a new schedule into the database
func (d *Database) AddSchedule(schedule Schedule) error {
	// Encode the schedule
	encoded, err := bson.Marshal(schedule)
	if err != nil {
		return err
	}

	key := buildKey(schedulePrefix, schedule.ID)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, encoded)
	})
}

// GetSchedule retrieves a schedule from the database
func (d *Database) GetSchedule(id string) (Schedule, error) {
	key := buildKey(schedulePrefix, id)

	var schedule Schedule
	err := d.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(key)
		if err != nil {
			return err
		}

		value, err := item.ValueCopy(nil)
		if err != nil {
			return err
		}

		return bson.Unmarshal(value, &schedule)
	})
	return schedule, err
}

// RemoveSchedule deletes a schedule from the database by name
func (d *Database) RemoveSchedule(id string) error {
	key := buildKey(schedulePrefix, id)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}
