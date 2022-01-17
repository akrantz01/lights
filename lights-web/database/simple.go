package database

import (
	"github.com/dgraph-io/badger/v3"
)

// GetColor retrieves the filled color set to the strip
func (d *Database) GetColor() (Color, error) {
	color := Color{
		Red:   0,
		Blue:  0,
		Green: 0,
	}

	err := d.db.View(func(txn *badger.Txn) error {
		// Attempt to fetch the item, returning the default if not found
		item, err := txn.Get([]byte("color"))
		if err == badger.ErrKeyNotFound {
			return nil
		} else if err != nil {
			return err
		}

		// Retrieve the value
		rawColor := make([]byte, 3)
		if _, err := item.ValueCopy(rawColor); err != nil {
			return err
		}

		// Extract the color byte values
		color.Red = rawColor[0]
		color.Green = rawColor[1]
		color.Blue = rawColor[2]

		return nil
	})
	return color, err
}

// SetColor stores the filled color set to the strip
func (d *Database) SetColor(c Color) error {
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("color"), []byte{c.Red, c.Green, c.Blue})
	})
}

// GetBrightness retrieves the current brightness of the strip
func (d *Database) GetBrightness() (uint8, error) {
	brightness := uint8(100)

	err := d.db.View(func(txn *badger.Txn) error {
		// Attempt to fetch the item, returning the default if not found
		item, err := txn.Get([]byte("brightness"))
		if err == badger.ErrKeyNotFound {
			return nil
		} else if err != nil {
			return err
		}

		// Retrieve the value
		v := make([]byte, 1)
		if _, err := item.ValueCopy(v); err != nil {
			return err
		}
		brightness = v[0]

		return nil
	})
	return brightness, err
}

// SetBrightness stores the brightness of the strip
func (d *Database) SetBrightness(brightness uint8) error {
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("brightness"), []byte{brightness})
	})
}

// GetState retrieves the current power state of the strip
func (d *Database) GetState() (bool, error) {
	state := false

	err := d.db.View(func(txn *badger.Txn) error {
		// Attempt to fetch the item, returning the default if not found
		item, err := txn.Get([]byte("state"))
		if err == badger.ErrKeyNotFound {
			return nil
		} else if err != nil {
			return err
		}

		// Retrieve the value
		v := make([]byte, 1)
		if _, err := item.ValueCopy(v); err != nil {
			return err
		}
		state = v[0] == 1

		return nil
	})

	return state, err
}

// SetState stores the current power state of the strip
func (d *Database) SetState(state bool) error {
	var value byte
	if state {
		value = 1
	}

	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("state"), []byte{value})
	})
}
