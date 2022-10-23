package database

import (
	"fmt"
	"reflect"

	gonanoid "github.com/matoous/go-nanoid"
	"go.uber.org/zap"
)

// GenerateID sets the id field on an object using reflection
func GenerateID(object interface{}) {
	v := reflect.ValueOf(object).Elem()
	id := v.FieldByName("ID")
	id.SetString(gonanoid.MustID(8))
}

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
