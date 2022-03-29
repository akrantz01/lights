package auth

import (
	"net/http"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/go-chi/chi/v5"
)

// Middleware creates an HTTP middleware for validating JWT tokens
func Middleware(validator *validator.Validator, permission Permission) func(next http.Handler) http.Handler {
	middleware := jwtmiddleware.New(validator.ValidateToken)
	return chi.Chain(middleware.CheckJWT, permissionsValidator(permission)).Handler
}

// permissionsValidator checks if the validated JWT has the requested permission
func permissionsValidator(permission Permission) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the custom claims
			claims := r.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
			customClaims := claims.CustomClaims.(*CustomClaims)

			// Check the permission
			permissions := NewPermissions(customClaims.Permissions)
			if permissions.Has(permission) {
				next.ServeHTTP(w, r)
			} else {
				w.WriteHeader(http.StatusForbidden)
				_, _ = w.Write([]byte(`{"message":"Improper permissions."}`))
			}
		})
	}
}
