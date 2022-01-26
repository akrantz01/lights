package database

import (
	"strings"

	"github.com/dgraph-io/badger/v3"
)

const animationPrefix = "animation-"

// ListAnimations retrieves a list of all known animations from the database
func (d *Database) ListAnimations() ([]string, error) {
	var animations []string

	err := d.db.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()

		// Iterate over all keys
		for iterator.Rewind(); iterator.Valid(); iterator.Next() {
			item := iterator.Item()
			key := string(item.Key())

			// Add only if it is an animation
			if strings.HasPrefix(key, animationPrefix) {
				animations = append(animations, strings.TrimPrefix(key, animationPrefix))
			}
		}

		return nil
	})
	return animations, err
}

// AddAnimation inserts a new animation into the database
func (d *Database) AddAnimation(name string) error {
	// Build the key
	key := []byte(animationPrefix)
	key = append(key, []byte(name)...)

	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, []byte{})
	})
}

// RemoveAnimation deletes an animation from the database by name
func (d *Database) RemoveAnimation(name string) error {
	// Build the key
	key := []byte(animationPrefix)
	key = append(key, []byte(name)...)

	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}

// SetCurrentAnimation sets the currently running animation
func (d *Database) SetCurrentAnimation(name string) error {
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("current-animation"), []byte(name))
	})
}

// GetCurrentAnimation gets the currently running animation
func (d *Database) GetCurrentAnimation() (string, error) {
	var animation string

	err := d.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("current-animation"))
		if err == badger.ErrKeyNotFound {
			return nil
		} else if err != nil {
			return err
		}

		// Retrieve the value
		value, err := item.ValueCopy(nil)
		if err != nil {
			return err
		}

		animation = string(value)
		return nil
	})

	return animation, err
}