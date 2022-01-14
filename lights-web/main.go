package main

import (
	"context"
	"io"
	"log"
	"net"

	"capnproto.org/go/capnp/v3/rpc"

	"github.com/akrantz01/lights/lights-web/lights"
)

func main() {
	conn, err := net.Dial("tcp", "192.168.1.6:30000")
	if err != nil {
		log.Fatalf("failed to dial: %v\n", err)
	}

	if err := client(context.Background(), conn); err != nil {
		log.Fatalf("failed to execute: %v\n", err)
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
