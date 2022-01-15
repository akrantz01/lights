package logging

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"
)

// GetLogger retrieves the scoped logger for a given request
func GetLogger(ctx context.Context) *zap.Logger {
	entry := ctx.Value(middleware.LogEntryCtxKey).(*RequestLoggerEntry)
	return entry.Logger
}

// Request is an HTTP middleware to log requests and responses
func Request(logger *zap.Logger) func(next http.Handler) http.Handler {
	var f middleware.LogFormatter = &requestLogger{logger}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			entry := f.NewLogEntry(r)
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			buf := newLimitBuffer(512)
			ww.Tee(buf)

			start := time.Now()
			defer func() {
				var respBody []byte
				if ww.Status() >= 400 {
					respBody, _ = ioutil.ReadAll(buf)
				}
				entry.Write(ww.Status(), ww.BytesWritten(), ww.Header(), time.Since(start), respBody)
			}()

			next.ServeHTTP(ww, middleware.WithLogEntry(r, entry))
		})
	}
}

type requestLogger struct {
	Logger *zap.Logger
}

func (l *requestLogger) NewLogEntry(r *http.Request) middleware.LogEntry {
	entry := &RequestLoggerEntry{}
	entry.Logger = l.Logger.With(
		zap.String("path", r.URL.Path),
		zap.String("method", r.Method),
		zap.String("remote", r.RemoteAddr),
		zap.String("id", middleware.GetReqID(r.Context())),
		zap.String("version", r.Proto),
	)
	entry.Logger.Info("started processing request")
	return entry
}

type RequestLoggerEntry struct {
	Logger *zap.Logger
}

func (l *RequestLoggerEntry) Write(status, bytes int, _ http.Header, elapsed time.Duration, _ interface{}) {
	logFunc := logLevelForStatus(l.Logger, status)
	latency := float64(elapsed.Nanoseconds()) / 1000000.0
	logFunc(
		"finished processing request",
		zap.Int("status", status),
		zap.Int("bytes", bytes),
		zap.Float64("latency", latency),
	)
}

func (l *RequestLoggerEntry) Panic(v interface{}, stack []byte) {
	stacktrace := "#"
	if !developmentOption {
		stacktrace = string(stack)
	}

	fields := []zap.Field{zap.String("stacktrace", stacktrace)}
	if developmentOption {
		fields = append(fields, zap.String("panic", fmt.Sprintf("%+v", v)))
	}

	l.Logger.Error("request handler panicked", fields...)
	if developmentOption {
		middleware.PrintPrettyStack(v)
	}
}

func logLevelForStatus(logger *zap.Logger, status int) func(msg string, fields ...zap.Field) {
	switch {
	case status <= 0:
		return logger.Warn
	case status < 400:
		return logger.Info
	case status >= 400 && status < 500:
		return logger.Warn
	case status >= 500:
		return logger.Error
	default:
		return logger.Info
	}
}
