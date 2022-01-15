package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"capnproto.org/go/capnp/v3/rpc"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"

	"github.com/akrantz01/lights/lights-web/lights"
	"github.com/akrantz01/lights/lights-web/logging"
)

func main() {
	logger, err := logging.New("debug", true)
	if err != nil {
		log.Fatalf("failed to initialize logging: %v\n", err)
	}
	defer logger.Sync()

	r := chi.NewRouter()

	// Register middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logging.Request(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))

	serverCtx, serverStopCtx := context.WithCancel(context.Background())
	server := &http.Server{
		Addr:    "127.0.0.1:3000",
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
	logger.Info("listening and ready to handle requests", zap.String("address", "127.0.0.1:3000"))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("an error occurred while running", zap.Error(err))
	}

	// Wait for server context to be stopped
	<-serverCtx.Done()

	logger.Info("shutdown complete. goodbye!")
}

func client() error {
	ctx := context.Background()
	conn, err := net.Dial("tcp", "192.168.1.6:30000")
	if err != nil {
		log.Fatalf("failed to dial: %v\n", err)
	}

	rpcConn := rpc.NewConn(rpc.NewStreamTransport(conn), nil)
	defer rpcConn.Close()

	lc := lights.LightController{Client: rpcConn.Bootstrap(ctx)}

	lc.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		params.SetLevel(60)
		return nil
	})

	result, free := lc.Fill(ctx, func(params lights.LightController_fill_Params) error {
		c, err := params.NewColor()
		if err != nil {
			return err
		}

		c.SetR(196)
		c.SetG(128)
		c.SetB(64)

		return nil
	})
	defer free()

	<-result.Done()

	return nil
}
