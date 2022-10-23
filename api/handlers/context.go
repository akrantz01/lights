package handlers

import (
	"context"
	"net/http"
)

type requestContextKey struct{}

// RequestContext contains arbitrary values to be attached to the request
type RequestContext struct {
	StripLength uint16
}

// WithRequestContext adds the request context to the request
func WithRequestContext(length uint16) func(next http.Handler) http.Handler {
	rc := RequestContext{
		StripLength: length,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), requestContextKey{}, rc)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetStripLength retrieves the strip length from the request context
func GetStripLength(ctx context.Context) uint16 {
	return ctx.Value(requestContextKey{}).(RequestContext).StripLength
}
