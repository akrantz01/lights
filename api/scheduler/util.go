package scheduler

import (
	"context"
	"net/http"
)

type schedulerContextKey struct{}

// WithScheduler attaches the scheduler to the request context
func WithScheduler(scheduler *Scheduler) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), schedulerContextKey{}, scheduler)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetScheduler retrieves the scheduler to add/remove jobs
func GetScheduler(ctx context.Context) *Scheduler {
	return ctx.Value(schedulerContextKey{}).(*Scheduler)
}
