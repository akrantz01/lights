package database

import (
	"encoding/binary"

	"github.com/dgraph-io/badger/v3"
)

// GetPixel retrieves a pixel by index in the database
func (d *Database) GetPixel(index uint16) (Pixel, error) {
	pixel := Pixel{
		Index: 0,
		Color: Color{
			Red:   0,
			Blue:  0,
			Green: 0,
		},
	}

	// Encode the index for retrieval
	encodedIndex := make([]byte, 2)
	binary.LittleEndian.PutUint16(encodedIndex, index)

	err := d.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte{'p', encodedIndex[0], encodedIndex[1]})
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
		pixel.Index = index
		pixel.Color.Red = rawColor[0]
		pixel.Color.Green = rawColor[1]
		pixel.Color.Blue = rawColor[2]

		return nil
	})

	return pixel, err
}

// SetPixel sets a pixel in the database
func (d *Database) SetPixel(pixel Pixel) error {
	// Encode the index into the key
	index := make([]byte, 2)
	binary.LittleEndian.PutUint16(index, pixel.Index)

	return d.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte{'p', index[0], index[1]}, []byte{pixel.Color.Red, pixel.Color.Green, pixel.Color.Blue})
	})
}
