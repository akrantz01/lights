package database

import (
	"fmt"

	"go.uber.org/zap"
)

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
