package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/database"
	"github.com/akrantz01/lights/lights-web/lights"
	"github.com/akrantz01/lights/lights-web/logging"
	"github.com/akrantz01/lights/lights-web/rpc"
)

func main() {
	config, err := ReadConfig()
	if err != nil {
		log.Fatalf("failed to read configuration: %v\n", err)
	}

	logger, err := logging.New(config.LogLevel, config.Development)
	if err != nil {
		log.Fatalf("failed to initialize logging: %v\n", err)
	}
	defer logger.Sync()

	// Connect to the database
	db, err := database.Open(config.DatabasePath)
	if err != nil {
		logger.Fatal("failed to open database", zap.String("path", config.DatabasePath))
	}

	// Connect to the controller
	lc, err := lights.Connect(config.ControllerAddr)
	if err != nil {
		logger.Fatal("failed to connect to the controller", zap.String("address", config.ControllerAddr))
	}

	// Start the action processor
	_, processorCancel := rpc.NewProcessor(db, lc)

	r := chi.NewRouter()

	// Register middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logging.Request(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))
	r.Use(database.WithDatabase(db))

	serverCtx, serverStopCtx := context.WithCancel(context.Background())
	server := &http.Server{
		Addr:    config.ListenAddr,
		Handler: r,
	}

	// Listen for syscall signals for process to interrupt/quit
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		// Create a 30s shutdown timeout
		shutdownCtx, _ := context.WithTimeout(serverCtx, 30*time.Second)

		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				logger.Fatal("graceful shutdown timed out... forcing exit")
			}
		}()

		// Trigger graceful shutdown
		err := server.Shutdown(shutdownCtx)
		if err != nil {
			logger.Fatal("failed to shutdown server", zap.Error(err))
		}
		serverStopCtx()
	}()

	// Start the server
	logger.Info("listening and ready to handle requests", zap.String("address", config.ListenAddr))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("an error occurred while running", zap.Error(err))
	}

	// Wait for server context to be stopped
	<-serverCtx.Done()

	processorCancel()

	if err := db.Close(); err != nil {
		logger.Fatal("failed to close the database")
	}

	logger.Info("shutdown complete. goodbye!")
}
