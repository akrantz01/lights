package database

import (
	"strings"

	"github.com/dgraph-io/badger/v3"
	gonanoid "github.com/matoous/go-nanoid"
	"go.mongodb.org/mongo-driver/bson"
)

const animationPrefix = "animation-"

// NewAnimation creates a new animation with the given name
func NewAnimation(name string) Animation {
	return Animation{
		Id:   gonanoid.MustID(idLength),
		Name: name,
	}
}

// ListAnimations retrieves a list of all known animations from the database
func (d *Database) ListAnimations() ([]Animation, error) {
	var animations []Animation

	err := d.db.View(func(txn *badger.Txn) error {
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()

		// Iterate over all keys
		for iterator.Rewind(); iterator.Valid(); iterator.Next() {
			item := iterator.Item()
			key := string(item.Key())

			// Add only if it is an animation
			if strings.HasPrefix(key, animationPrefix) {
				value, err := item.ValueCopy(nil)
				if err != nil {
					return err
				}

				var animation Animation
				if err := bson.Unmarshal(value, &animation); err != nil {
					return err
				}

				animations = append(animations, animation)
			}
		}

		return nil
	})
	return animations, err
}

// AddAnimation inserts a new animation into the database
func (d *Database) AddAnimation(animation Animation) error {
	// Encode the animation
	encoded, err := bson.Marshal(animation)
	if err != nil {
		return err
	}

	key := buildKey(animationPrefix, animation.Id)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set(key, encoded)
	})
}

// GetAnimation retrieves all the details about an animation
// Currently this is equivalent to an existence check
func (d *Database) GetAnimation(id string) (Animation, error) {
	key := buildKey(animationPrefix, id)

	var animation Animation
	err := d.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get(key)
		if err != nil {
			return err
		}

		value, err := item.ValueCopy(nil)
		if err != nil {
			return err
		}

		return bson.Unmarshal(value, &animation)
	})
	return animation, err
}

// RemoveAnimation deletes an animation from the database by name
func (d *Database) RemoveAnimation(id string) error {
	key := buildKey(animationPrefix, id)
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Delete(key)
	})
}

// SetCurrentAnimation sets the currently running animation
func (d *Database) SetCurrentAnimation(id string) error {
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("current-animation"), []byte(id))
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
