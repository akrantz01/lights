package database

import (
	"encoding/binary"

	"github.com/dgraph-io/badger/v3"

	"github.com/akrantz01/lights/lights-web/util"
)

// GetPixels retrieves all the colors of the pixels in the database
func (d *Database) GetPixels() ([]Color, error) {
	colors := make([]Color, d.length)

	err := d.db.View(func(txn *badger.Txn) error {
		for i := range colors {
			// Encode the index for retrieval
			encoded := make([]byte, 2)
			binary.LittleEndian.PutUint16(encoded, uint16(i))

			// Fetch the item
			item, err := txn.Get([]byte{'p', encoded[0], encoded[1]})
			if err == badger.ErrKeyNotFound {
				continue
			} else if err != nil {
				return err
			}

			// Retrieve the value
			rawColor := make([]byte, 3)
			if _, err := item.ValueCopy(rawColor); err != nil {
				return err
			}

			// Extract the color byte values
			colors[i].Red = rawColor[0]
			colors[i].Green = rawColor[1]
			colors[i].Blue = rawColor[2]
		}

		return nil
	})
	return colors, err
}

// SetPixel sets a pixel in the database
func (d *Database) SetPixel(index uint16, color Color) error {
	// Encode the index into the key
	encoded := make([]byte, 2)
	binary.LittleEndian.PutUint16(encoded, index)

	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte{'p', encoded[0], encoded[1]}, []byte{color.Red, color.Green, color.Blue})
	})
}

// SetPixelRange sets a range of pixels to a given color
func (d *Database) SetPixelRange(start uint16, end uint16, color Color) error {
	indexes := util.RangeToIndexes(start, end)
	return d.SetArbitraryPixels(indexes, color)
}

// SetArbitraryPixels sets a list of pixel indexes to the given color
func (d *Database) SetArbitraryPixels(indexes []uint16, color Color) error {
	// Convert the color to its binary encoding
	encodedColor := []byte{color.Red, color.Green, color.Blue}

	return d.db.Update(func(txn *badger.Txn) error {
		for _, i := range indexes {
			// Encode the index for insertion
			encoded := make([]byte, 2)
			binary.LittleEndian.PutUint16(encoded, i)

			// Set the value
			if err := txn.Set([]byte{'p', encoded[0], encoded[1]}, encodedColor); err != nil {
				return err
			}
		}

		return nil
	})
}

// SetAllPixels sets the color of every pixel in the database from the given array
func (d *Database) SetAllPixels(colors []Color) error {
	return d.db.Update(func(txn *badger.Txn) error {
		for i, color := range colors {
			// Encode the index for insertion
			encoded := make([]byte, 2)
			binary.LittleEndian.PutUint16(encoded, uint16(i))

			// Set the value
			if err := txn.Set([]byte{'p', encoded[0], encoded[1]}, []byte{color.Red, color.Green, color.Blue}); err != nil {
				return err
			}
		}

		return nil
	})
}