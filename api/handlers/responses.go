package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"go.uber.org/zap"
)

type ResponseOption func(r *response)

type response struct {
	StatusCode int
	Error      bool
	Content    interface{}
}

// WithStatus change the status code of the response
func WithStatus(code int) ResponseOption {
	return func(r *response) {
		r.StatusCode = code
	}
}

// WithError makes the response an error
func WithError(reason string) ResponseOption {
	return func(r *response) {
		r.Content = reason
		r.Error = true
	}
}

// WithData adds some arbitrary data to the request
func WithData(data interface{}) ResponseOption {
	return func(r *response) {
		r.Content = data
	}
}

// AsFatal responds with an internal server error
func AsFatal() ResponseOption {
	return func(r *response) {
		r.StatusCode = http.StatusInternalServerError
		r.Error = true
		r.Content = "an unexpected error occurred"
	}
}

// Respond generates and sends a response to the requester
func Respond(w http.ResponseWriter, opts ...ResponseOption) {
	response := &response{
		StatusCode: http.StatusOK,
		Error:      false,
		Content:    nil,
	}

	// Loop through options
	for _, opt := range opts {
		opt(response)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(response.StatusCode)

	// Generate the response body
	var body []byte
	if response.Content == nil {
		body = []byte(`{"success":true}`)
	} else {
		if response.Error {
			body = []byte(fmt.Sprintf(`{"success":false,"reason":"%s"}`, response.Content))
		} else {
			encoded, err := json.Marshal(response.Content)
			if err != nil {
				zap.L().Named("responses").Error("failed to encode response", zap.Error(err))
				return
			}

			body = []byte(fmt.Sprintf(`{"success":true,"data":%s}`, encoded))
		}
	}

	if _, err := w.Write(body); err != nil {
		zap.L().Named("responses").Error("failed to send response", zap.Error(err))
	}
}
