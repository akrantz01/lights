package main

import (
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config contains all the runtime configuration information
type Config struct {
	ListenAddr     string
	ControllerAddr string

	DatabasePath string

	LogLevel    string
	Development bool

	StripLength int
}

// ReadConfig extracts all the configuration options from the environment variables
func ReadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	listenHost := getEnvOrDefault("LIGHTS_WEB_HOST", "127.0.0.1")
	listenPort := getEnvOrDefault("LIGHTS_WEB_PORT", "3000")
	listenAddress := net.JoinHostPort(listenHost, listenPort)

	controllerHost := getEnvOrDefault("LIGHTS_CONTROLLER_HOST", "127.0.0.1")
	controllerPort := getEnvOrDefault("LIGHTS_CONTROLLER_PORT", "30000")
	controllerAddress := net.JoinHostPort(controllerHost, controllerPort)

	rawDevelopment := strings.ToLower(getEnvOrDefault("LIGHTS_DEVELOPMENT", "no"))
	development := rawDevelopment == "y" || rawDevelopment == "yes" || rawDevelopment == "true"

	stripDensity, err := strconv.Atoi(getEnvOrDefault("LIGHTS_STRIP_DENSITY", "30"))
	if err != nil {
		return nil, err
	}
	stripLength, err := strconv.Atoi(getEnvOrDefault("LIGHTS_STRIP_LENGTH", "5"))
	if err != nil {
		return nil, err
	}

	return &Config{
		ListenAddr:     listenAddress,
		ControllerAddr: controllerAddress,
		DatabasePath:   getEnvOrDefault("LIGHTS_WEB_DATABASE_PATH", "./badger"),
		LogLevel:       getEnvOrDefault("LIGHTS_LOG_LEVEL", "info"),
		Development:    development,
		StripLength:    stripDensity * stripLength,
	}, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}

	return value
}