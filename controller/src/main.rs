use eyre::WrapErr;
use tonic::transport::Server;
use tonic_health::server::health_reporter;
use tracing::{info, info_span};

mod config;
mod errors;
mod interface;
mod lights;
mod pixels;

use config::Config;
use pixels::Pixels;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    color_eyre::install()?;
    let config = Config::load().wrap_err("failed to load configuration")?;
    tracing_subscriber::fmt()
        .with_max_level(config.log_level)
        .init();

    // Connect to the pixels
    let pixels = Pixels::new(config.leds).wrap_err("failed to setup LEDs")?;
    info!(count = %config.leds, "connected to LED strip");

    // Create the health reporter
    let (mut reporter, health_service) = health_reporter();
    reporter.set_serving::<lights::Service>().await;

    // Start the server
    info!(address = %config.address, "listening and ready to handle connections");
    Server::builder()
        .trace_fn(|_| info_span!("controller"))
        .add_service(health_service)
        .add_service(lights::service(pixels))
        .serve(config.address)
        .await?;

    Ok(())
}
