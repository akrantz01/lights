use eyre::{eyre, WrapErr};
use serde::{de::Error, Deserialize, Deserializer};
use std::{env, net::SocketAddr, path::PathBuf, str::FromStr};
use tokio::fs;
use tracing::Level;

static DEFAULT_CONFIG_PATH: &'static str = "/etc/lights/config.toml";

#[derive(Debug)]
pub struct Config {
    /// The host and port to listen on
    pub address: SocketAddr,

    /// Where to store/load registered animations
    pub animations_path: PathBuf,

    /// The total amount of LEDs on the strip
    pub leds: u16,

    /// The minimum level to log at
    pub log_level: Level,

    /// Whether to run in development mode
    pub development: bool,
}

impl From<RawConfig> for Config {
    fn from(raw: RawConfig) -> Self {
        Config {
            address: raw.controller.address,
            animations_path: raw.controller.animations,
            leds: raw.strip_density * raw.strip_length,
            log_level: raw.log_level,
            development: raw.development,
        }
    }
}

impl Config {
    /// Load the configuration from the environment
    pub async fn load() -> eyre::Result<Config> {
        let path = find_config_path()?;
        let contents = fs::read(&path).await.wrap_err("unable to open file")?;

        let raw = toml::from_slice::<RawConfig>(&contents).wrap_err("TOML parsing failed")?;
        return Ok(raw.into());
    }
}

/// Attempt to find the path to the configuration file
fn find_config_path() -> eyre::Result<PathBuf> {
    let default = env::var("CONFIG_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_CONFIG_PATH));
    if default.exists() && default.is_file() {
        return Ok(default);
    }

    // Traverse backwards from the current directory to try and find a config file
    for candidate in env::current_dir()?.ancestors() {
        let candidate = candidate.join("config.toml");
        if candidate.exists() && candidate.is_file() {
            return Ok(candidate);
        }
    }

    Err(eyre!("config file not found"))
}

#[derive(Debug, Deserialize)]
struct RawConfig {
    #[serde(deserialize_with = "parse_level")]
    log_level: Level,
    strip_density: u16,
    strip_length: u16,
    development: bool,
    controller: RawControllerConfig,
}

#[derive(Debug, Deserialize)]
struct RawControllerConfig {
    address: SocketAddr,
    animations: PathBuf,
}

fn parse_level<'de, D>(deserializer: D) -> Result<Level, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    Level::from_str(&s).map_err(Error::custom)
}
