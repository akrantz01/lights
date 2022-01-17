package rpc

import (
	"context"
	"net/http"
)

const rpcContextKey = "actions-rpc-key"

// WithActions attaches the channel to the request context
func WithActions(actions chan Callable) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), rpcContextKey, actions)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetActions retrieves a channel to publish changes
func GetActions(ctx context.Context) chan Callable {
	return ctx.Value(rpcContextKey).(chan Callable)
}
