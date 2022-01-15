package database

import (
	"github.com/dgraph-io/badger/v3"
)

// GetLastColor retrieves the last constant color set to the strip
func (d *Database) GetLastColor() (Color, error) {
	color := Color{
		Red:   0,
		Blue:  0,
		Green: 0,
	}

	err := d.db.View(func(txn *badger.Txn) error {
		// Attempt to fetch the item, returning the default if not found
		item, err := txn.Get([]byte("last-color"))
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
		color.Blue = rawColor[1]
		color.Green = rawColor[2]

		return nil
	})
	return color, err
}

// SetLastColor sets the most recent constant color set to the strip
func (d *Database) SetLastColor(c Color) error {
	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("last-color"), []byte{c.Red, c.Blue, c.Green})
	})
}
