package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/api/auth"
	"github.com/akrantz01/lights/api/database"
	"github.com/akrantz01/lights/api/events"
	"github.com/akrantz01/lights/api/handlers"
	"github.com/akrantz01/lights/api/handlers/animations"
	"github.com/akrantz01/lights/api/handlers/presets"
	"github.com/akrantz01/lights/api/handlers/schedules"
	"github.com/akrantz01/lights/api/lights"
	"github.com/akrantz01/lights/api/logging"
	"github.com/akrantz01/lights/api/rpc"
	"github.com/akrantz01/lights/api/scheduler"
	"github.com/akrantz01/lights/api/ws"
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
	defer func() { _ = logger.Sync() }()

	// Connect to the database
	db, err := database.Open(config.DatabasePath, config.StripLength)
	if err != nil {
		logger.Fatal("failed to open database", zap.String("path", config.DatabasePath))
	}

	// Connect to the controller
	lc, err := lights.Connect(config.ControllerAddr)
	if err != nil {
		logger.Fatal("failed to connect to the controller", zap.String("address", config.ControllerAddr))
	}

	// Start the action processor
	actions, processorCancel := rpc.NewProcessor(db, lc)

	// Start the websocket hub
	hub := ws.NewHub()

	// Start the schedule processor
	s, err := scheduler.New(config.Timezone, config.StripLength, db, actions, hub.Broadcast())
	if err != nil {
		logger.Fatal("failed to setup scheduler", zap.Error(err))
	}

	// Load the pre-existing schedules
	if err := s.LoadFromDatabase(); err != nil {
		logger.Fatal("failed to load existing schedules", zap.Error(err))
	}

	// Create the event emitter
	emitter := events.New()

	// Setup JWT validation
	validator, err := auth.NewValidator(config.IssuerURL)
	if err != nil {
		logger.Fatal("failed to initialize JWT validator", zap.Error(err))
	}

	r := chi.NewRouter()

	// Register middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logging.Request(logger))
	r.Use(middleware.Recoverer)
	r.Use(cors.AllowAll().Handler)
	r.Use(middleware.Heartbeat("/ping"))
	r.Use(database.WithDatabase(db))
	r.Use(rpc.WithActions(actions))
	r.Use(scheduler.WithScheduler(s))
	r.Use(handlers.WithRequestContext(config.StripLength))
	r.Use(events.WithEmitter(emitter))

	// Register routes
	r.Route("/animations", animations.Router(validator))
	r.Route("/presets", presets.Router(validator))
	r.Route("/schedules", schedules.Router(validator))
	r.Get("/ws", ws.Handler(hub, validator))
	r.Get("/events", emitter.Handler)

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
		shutdownCtx, shutdownStopCtx := context.WithTimeout(serverCtx, 30*time.Second)

		go func() {
			<-shutdownCtx.Done()
			if errors.Is(shutdownCtx.Err(), context.DeadlineExceeded) {
				logger.Fatal("graceful shutdown timed out... forcing exit")
			}
		}()

		// Trigger graceful shutdown
		err := server.Shutdown(shutdownCtx)
		if err != nil {
			logger.Fatal("failed to shutdown server", zap.Error(err))
		}

		serverStopCtx()
		shutdownStopCtx()
	}()

	// Start the server
	logger.Info("listening and ready to handle requests", zap.String("address", config.ListenAddr))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("an error occurred while running", zap.Error(err))
	}

	// Wait for server context to be stopped
	<-serverCtx.Done()

	processorCancel()

	s.Stop()
	hub.Stop()
	emitter.Close()

	if err := db.Close(); err != nil {
		logger.Fatal("failed to close the database")
	}

	logger.Info("shutdown complete. goodbye!")
}
