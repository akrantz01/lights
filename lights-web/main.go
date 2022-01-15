package main

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"

	"capnproto.org/go/capnp/v3/rpc"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/akrantz01/lights/lights-web/lights"
	"github.com/akrantz01/lights/lights-web/logging"
)

func main() {
	logger, err := logging.New("debug", true)
	if err != nil {
		log.Fatalf("failed to initialize logging: %v\n", err)
	}
	defer logger.Sync()

	conn, err := net.Dial("tcp", "192.168.1.6:30000")
	if err != nil {
		log.Fatalf("failed to dial: %v\n", err)
	}

	if err := client(context.Background(), conn); err != nil {
		log.Fatalf("failed to execute: %v\n", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(logging.Request(logger))
	r.Use(middleware.Recoverer)
	r.Use(middleware.Heartbeat("/ping"))
	if err := http.ListenAndServe(":3000", r); err != nil {
		log.Fatalf("failed to bind HTTP server: %v\n", err)
	}
}

func client(ctx context.Context, rwc io.ReadWriteCloser) error {
	conn := rpc.NewConn(rpc.NewStreamTransport(rwc), nil)
	defer conn.Close()

	lc := lights.LightController{Client: conn.Bootstrap(ctx)}

	lc.Brightness(ctx, func(params lights.LightController_brightness_Params) error {
		params.SetLevel(60)
		return nil
	})

	result, free := lc.Fill(ctx, func(params lights.LightController_fill_Params) error {
		c, err := params.NewColor()
		if err != nil {
			return err
		}

		c.SetR(96)
		c.SetG(0)
		c.SetB(255)

		return nil
	})
	defer free()

	<-result.Done()

	return nil
}
