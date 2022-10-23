package auth

import (
	"context"
	"net/url"
	"time"

	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
)

type CustomClaims struct {
	Permissions []string `json:"groups"`
}

// Validate does no validation as we just want to get the token claims
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

// NewValidator creates a new JWT validator for the given issuer
func NewValidator(issuer *url.URL) (*validator.Validator, error) {
	customClaims := func() validator.CustomClaims {
		return &CustomClaims{}
	}

	provider := jwks.NewCachingProvider(issuer, 5*time.Minute)
	return validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuer.String(),
		[]string{"https://lights.krantz.dev"},
		validator.WithCustomClaims(customClaims),
	)
}
