package database

import (
	"strings"

	"github.com/dgraph-io/badger/v3"
	"go.mongodb.org/mongo-driver/bson"
)

const presetPrefix = "preset-"

// ListPresets gets a list of all presets in the database
func (d *Database) ListPresets() ([]PartialPreset, error) {
	var presets []PartialPreset

	err := d.db.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()

		// Iterate over all keys
		for iterator.Rewind(); iterator.Valid(); iterator.Next() {
			item := iterator.Item()
			key := string(item.Key())

			// Add only if it is a preset
			if strings.HasPrefix(key, presetPrefix) {
				value, err := item.ValueCopy(nil)
				if err != nil {
					return err
				}

				var preset PartialPreset
				if err := bson.Unmarshal(value, &preset); err != nil {
					return err
				}

				presets = append(presets, preset)
			}
		}

		return nil
	})

	return presets, err
}

// AddPreset inserts a new preset into the database
func (d *Database) AddPreset(preset Preset) error {
	// Encode the preset
	encoded, err := bson.Marshal(preset)
	if err != nil {
		return err
	}

	key := buildKey(presetPrefix, preset.Id)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, encoded)
	})
}

// GetPreset retrieves a preset from the database
func (d *Database) GetPreset(id string) (Preset, error) {
	key := buildKey(presetPrefix, id)

	var preset Preset
	err := d.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(key)
		if err != nil {
			return err
		}

		value, err := item.ValueCopy(nil)
		if err != nil {
			return err
		}

		return bson.Unmarshal(value, &preset)
	})
	return preset, err
}

// RemovePreset deletes a preset from the database by name
func (d *Database) RemovePreset(id string) error {
	key := buildKey(presetPrefix, id)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}
