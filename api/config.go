package main

import (
	"errors"
	"net"
	"net/url"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

const defaultConfigPath = "/etc/lights/config.toml"

// Config contains all the runtime configuration information
type Config struct {
	ListenAddr     string
	ControllerAddr string

	DatabasePath string

	Timezone    string
	LogLevel    string
	Development bool

	StripLength uint16

	IssuerURL *url.URL
}

// ReadConfig extracts all the configuration options from the environment variables
func ReadConfig() (*Config, error) {
	path, err := findConfigPath()
	if err != nil {
		return nil, err
	}

	var raw rawConfig
	if _, err := toml.DecodeFile(path, &raw); err != nil {
		return nil, err
	}

	return &Config{
		ListenAddr:     net.JoinHostPort(raw.Web.Host, raw.Web.Port),
		ControllerAddr: raw.Controller.Address,
		DatabasePath:   raw.Web.Database,
		Timezone:       raw.Web.Timezone,
		LogLevel:       raw.LogLevel,
		Development:    raw.Development,
		StripLength:    raw.StripLength * raw.StripDensity,
		IssuerURL:      raw.Web.Auth.IssuerURL.URL,
	}, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}

	return value
}

// Attempt to find the path to the configuration file
func findConfigPath() (string, error) {
	defaultPath := getEnvOrDefault("CONFIG_PATH", defaultConfigPath)
	if exists(defaultPath) {
		return defaultPath, nil
	}

	currentDir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Traverse backwards from the current directory to try and find a config file
	candidate := currentDir
	for {
		test := filepath.Join(candidate, "config.toml")
		if exists(test) {
			return test, nil
		}

		if candidate == string(os.PathSeparator) {
			break
		}
		candidate = filepath.Dir(candidate)
	}

	return "", errors.New("config file not found")
}

// Check that the path exists and is a file
func exists(path string) bool {
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}

	return !info.IsDir()
}

type rawConfig struct {
	LogLevel     string `toml:"log_level"`
	StripDensity uint16 `toml:"strip_density"`
	StripLength  uint16 `toml:"strip_length"`
	Development  bool   `toml:"development"`

	Controller rawControllerConfig `toml:"controller"`
	Web        rawWebConfig        `toml:"web"`
}

type rawControllerConfig struct {
	Address string `toml:"address"`
}

type rawWebConfig struct {
	Host     string `toml:"host"`
	Port     string `toml:"port"`
	Database string `toml:"database"`
	Timezone string `toml:"timezone"`

	Auth rawWebAuthConfig `toml:"auth"`
}

type rawWebAuthConfig struct {
	Enable    bool         `toml:"enable"`
	IssuerURL parseableUrl `toml:"jwt_issuer"`
}

type parseableUrl struct {
	*url.URL
}

func (u *parseableUrl) UnmarshalText(text []byte) error {
	var err error
	u.URL, err = url.Parse(string(text))
	return err
}
