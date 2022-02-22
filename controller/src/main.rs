use tonic::transport::Server;
use tracing::{info, info_span};

mod config;
mod lights;

use config::Config;

#[tokio::main]
async fn main() {
    let config = Config::load();

    tracing_subscriber::fmt()
        .with_max_level(config.log_level)
        .init();

    // Start the server
    info!(address = %config.address, "listening and ready to handle connections");
    Server::builder()
        .trace_fn(|_| info_span!("controller"))
        .add_service(lights::service())
        .serve(config.address)
        .await
        .unwrap();
}
