package main

import (
	"net"
	"net/url"
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

	Timezone    string
	LogLevel    string
	Development bool

	StripLength uint16

	IssuerUrl *url.URL
}

// ReadConfig extracts all the configuration options from the environment variables
func ReadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	listenHost := getEnvOrDefault("LIGHTS_WEB_HOST", "127.0.0.1")
	listenPort := getEnvOrDefault("LIGHTS_WEB_PORT", "3000")
	listenAddress := net.JoinHostPort(listenHost, listenPort)

	controllerAddress := getEnvOrDefault("LIGHTS_CONTROLLER_ADDRESS", "127.0.0.1:30000")

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

	issuerUrl, err := url.Parse(getEnvOrDefault("LIGHTS_JWT_ISSUER", "https://some-domain.us.auth0.com"))
	if err != nil {
		return nil, err
	}

	return &Config{
		ListenAddr:     listenAddress,
		ControllerAddr: controllerAddress,
		DatabasePath:   getEnvOrDefault("LIGHTS_WEB_DATABASE_PATH", "./badger"),
		Timezone:       getEnvOrDefault("LIGHTS_TIMEZONE", "UTC"),
		LogLevel:       getEnvOrDefault("LIGHTS_LOG_LEVEL", "info"),
		Development:    development,
		StripLength:    uint16(stripDensity * stripLength),
		IssuerUrl:      issuerUrl,
	}, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}

	return value
}
