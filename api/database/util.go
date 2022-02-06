package database

import (
	"fmt"
	"regexp"
	"strings"

	"go.uber.org/zap"
)

const idLength = 8

type loggerShim struct{}

func (l loggerShim) Errorf(template string, args ...interface{}) {
	msg := fmt.Sprintf(template, args...)
	zap.L().WithOptions(zap.AddCallerSkip(1)).Error(msg)
}

func (l loggerShim) Warningf(template string, args ...interface{}) {
	msg := fmt.Sprintf(template, args...)
	zap.L().WithOptions(zap.AddCallerSkip(1)).Warn(msg)
}

func (l loggerShim) Infof(template string, args ...interface{}) {
	msg := fmt.Sprintf(template, args...)
	zap.L().WithOptions(zap.AddCallerSkip(1)).Info(msg)
}

func (l loggerShim) Debugf(template string, args ...interface{}) {
	msg := fmt.Sprintf(template, args...)
	zap.L().WithOptions(zap.AddCallerSkip(1)).Debug(msg)
}

// buildKey creates a database key from a string prefix and the name
func buildKey(base, name string) []byte {
	key := []byte(base)
	return append(key, []byte(name)...)
}

var urlSafe = regexp.MustCompile(`[^a-z0-9-]`)

// Slugify converts an arbitrary key to a URL-safe string consisting of the characters a-z, 0-9 and -
func Slugify(key string) string {
	lower := strings.ToLower(key)
	noSpaces := strings.ReplaceAll(lower, " ", "-")
	return urlSafe.ReplaceAllLiteralString(noSpaces, "")
}
