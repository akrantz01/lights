package events

import (
	"context"
	"net/http"
)

const emitterContextKey = "emitter-context-key"

// WithEmitter adds the event emitter to the request context
func WithEmitter(emitter *Emitter) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), emitterContextKey, emitter)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetEmitter retrieves a function to publish messages with
func GetEmitter(ctx context.Context) *Emitter {
	return ctx.Value(emitterContextKey).(*Emitter)
}
