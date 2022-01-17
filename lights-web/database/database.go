package database

import (
	"context"
	"net/http"

	"github.com/dgraph-io/badger/v3"
	"github.com/dgraph-io/badger/v3/options"
)

const databaseContextKey = "badger-database-key"

type Database struct {
	db     *badger.DB
	length uint16
}

// Open opens a "connection" to the database
func Open(path string, length uint16) (*Database, error) {
	opts := badger.DefaultOptions(path).WithCompression(options.Snappy).WithLogger(loggerShim{})
	db, err := badger.Open(opts)
	if err != nil {
		return nil, err
	}

	if err := db.VerifyChecksum(); err != nil {
		return nil, err
	}

	return &Database{
		db:     db,
		length: length,
	}, nil
}

// Close writes all changes and closes the connection
func (d *Database) Close() error {
	if err := d.db.Sync(); err != nil {
		return err
	}
	return d.db.Close()
}

// WithDatabase attaches a database connection to the request context
func WithDatabase(db *Database) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), databaseContextKey, db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetDatabase retrieves a connection to the database
func GetDatabase(ctx context.Context) *Database {
	return ctx.Value(databaseContextKey).(*Database)
}
