use eyre::WrapErr;
use tonic::transport::Server;
use tracing::{info, info_span};

mod config;
mod lights;

use config::Config;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    color_eyre::install()?;
    let config = Config::load().wrap_err("failed to load configuration")?;
    tracing_subscriber::fmt()
        .with_max_level(config.log_level)
        .init();

    // Start the server
    info!(address = %config.address, "listening and ready to handle connections");
    Server::builder()
        .trace_fn(|_| info_span!("controller"))
        .add_service(lights::service())
        .serve(config.address)
        .await?;

    Ok(())
}
