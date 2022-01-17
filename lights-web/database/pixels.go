package database

import (
	"encoding/binary"

	"github.com/dgraph-io/badger/v3"

	"github.com/akrantz01/lights/lights-web/util"
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
