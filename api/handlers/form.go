package handlers

import (
	"io"
	"net/http"
)

// OpenFormFile retrieves an uploaded file from the form. The maximum file size is 10 MB.
func OpenFormFile(r *http.Request, name string) (io.ReadCloser, error) {
	// Parse the form
	// This is safe to call multiple times
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return nil, err
	}

	// Open the file
	file, _, err := r.FormFile(name)
	if err != nil {
		return nil, err
	}

	return file, nil
}
