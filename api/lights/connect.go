package lights

// Connect starts an RPC connection to the controller
func Connect(address string) (*Controller, error) {
	c := &Controller{
		address: address,
	}

	if err := c.connect(); err != nil {
		return nil, err
	}

	return c, nil
}
