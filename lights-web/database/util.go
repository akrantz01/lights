package database

import "go.uber.org/zap"

type loggerShim struct{}

func (l loggerShim) Errorf(template string, args ...interface{}) {
	zap.S().Errorf(template, args)
}

func (l loggerShim) Warningf(template string, args ...interface{}) {
	zap.S().Warnf(template, args)
}

func (l loggerShim) Infof(template string, args ...interface{}) {
	zap.S().Infof(template, args)
}

func (l loggerShim) Debugf(template string, args ...interface{}) {
	zap.S().Debugf(template, args)
}
