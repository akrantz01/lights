package database

import (
	"strings"

	"github.com/dgraph-io/badger/v3"
	"go.mongodb.org/mongo-driver/bson"
)

const presetPrefix = "preset-"

// ListPresets gets a list of all presets in the database
func (d *Database) ListPresets() ([]string, error) {
	var presets []string

	err := d.db.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()

		// Iterate over all keys
		for iterator.Rewind(); iterator.Valid(); iterator.Next() {
			item := iterator.Item()
			key := string(item.Key())

			// Add only if it is a preset
			if strings.HasPrefix(key, presetPrefix) {
				presets = append(presets, strings.TrimPrefix(key, presetPrefix))
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

	key := buildKey(presetPrefix, preset.Slug)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, encoded)
	})
}

// GetPreset retrieves a preset from the database
func (d *Database) GetPreset(slug string) (Preset, error) {
	key := buildKey(presetPrefix, slug)

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
func (d *Database) RemovePreset(slug string) error {
	key := buildKey(presetPrefix, slug)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}
