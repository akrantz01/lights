use std::{env, net::SocketAddr, path::PathBuf};
use tracing::{warn, Level};

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

impl Config {
    /// Load the configuration from the environment
    pub fn load() -> eyre::Result<Config> {
        if dotenv::dotenv().is_err() {
            warn!(".env file not found");
        }

        let address = env::var("LIGHTS_CONTROLLER_ADDRESS")
            .unwrap_or_else(|_| "127.0.0.1:30000".into())
            .parse()?;
        let animations_path = env::var("LIGHTS_CONTROLLER_ANIMATIONS_PATH")
            .unwrap_or_else(|_| "./animations".into())
            .into();
        let development = env::var("LIGHTS_DEVELOPMENT")
            .map(|s| s.to_lowercase())
            .map(|d| d == "yes" || d == "y" || d == "true" || d == "t")
            .unwrap_or(false);
        let log_level = env::var("LIGHTS_LOG_LEVEL")
            .unwrap_or_else(|_| "info".into())
            .parse()?;

        // Calculate the total number of LEDs
        let density: u16 = env::var("LIGHTS_STRIP_DENSITY")
            .unwrap_or_else(|_| "30".into())
            .parse()?;
        let length: u16 = env::var("LIGHTS_STRIP_LENGTH")
            .unwrap_or_else(|_| "5".into())
            .parse()?;

        Ok(Config {
            address,
            animations_path,
            development,
            leds: density * length,
            log_level,
        })
    }
}
