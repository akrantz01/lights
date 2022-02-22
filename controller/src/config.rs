use std::{
    env,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    path::PathBuf,
};
use tracing::Level;

#[derive(Debug)]
pub struct Config {
    /// The host and port to listen on
    pub address: SocketAddr,

    /// Where to store/load registered animations
    pub animations_path: PathBuf,

    /// The total amount of LEDs on the strip
    pub leds: i16,

    /// The minimum level to log at
    pub log_level: Level,

    /// Whether to run in development mode
    pub development: bool,
}

impl Config {
    /// Load the configuration from the environment
    pub fn load() -> Config {
        dotenv::dotenv().unwrap();

        let address = env::var("LIGHTS_CONTROLLER_ADDRESS")
            .ok()
            .map(|s| s.parse().ok())
            .flatten()
            .unwrap_or(SocketAddr::new(
                IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)),
                30000,
            ));
        let animations_path = env::var("LIGHTS_CONTROLLER_ANIMATIONS_PATH")
            .map(From::from)
            .unwrap_or("./animations".into());
        let development = env::var("LIGHTS_DEVELOPMENT")
            .map(|s| s.to_lowercase())
            .map(|d| d == "yes" || d == "y" || d == "true" || d == "t")
            .unwrap_or(false);
        let log_level = env::var("LIGHTS_LOG_LEVEL")
            .ok()
            .map(|s| s.parse().ok())
            .flatten()
            .unwrap_or(Level::INFO);

        // Calculate the total number of LEDs
        let density = env::var("LIGHTS_STRIP_DENSITY")
            .ok()
            .map(|s| s.parse().ok())
            .flatten()
            .unwrap_or(30);
        let length = env::var("LIGHTS_STRIP_LENGTH")
            .ok()
            .map(|s| s.parse().ok())
            .flatten()
            .unwrap_or(5);

        Config {
            address,
            animations_path,
            development,
            leds: density * length,
            log_level,
        }
    }
}
