package util

import "math"

// RangeToIndexes converts a range with start and end to an array
func RangeToIndexes(start, end uint16) []uint16 {
	length := int(math.Abs(float64(int16(start)-int16(end))) + 1)
	result := make([]uint16, length)

	if start > end {
		start, end = end, start
	}

	i := 0
	for v := start; v < end+1; v++ {
		result[i] = v
		i++
	}

	return result
}
