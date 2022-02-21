package auth

import (
	"net/http"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
)

// Middleware creates an HTTP middleware for validating JWT tokens
func Middleware(validator *validator.Validator) func(next http.Handler) http.Handler {
	middleware := jwtmiddleware.New(validator.ValidateToken)
	return middleware.CheckJWT
}
