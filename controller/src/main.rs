use eyre::WrapErr;
use tokio::{fs, signal};
use tonic::transport::Server;
use tonic_health::server::health_reporter;
use tracing::{info, info_span};
use tracing_subscriber::fmt::format::FmtSpan;

mod animations;
mod config;
mod errors;
mod interface;
mod lights;
mod pixels;

use animations::Animator;
use config::Config;
use pixels::Pixels;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    color_eyre::install()?;
    let config = Config::load().wrap_err("failed to load configuration")?;
    tracing_subscriber::fmt()
        .with_span_events(FmtSpan::CLOSE)
        .with_max_level(config.log_level)
        .init();

    // Ensure animations folder exists
    if !config.animations_path.exists() {
        fs::create_dir_all(&config.animations_path)
            .await
            .wrap_err("failed to create animations directory")?;
    }

    // Connect to the pixels
    let (pixels, pixels_handle) = Pixels::new(config.leds)
        .await
        .wrap_err("failed to setup LEDs")?;
    info!(count = %config.leds, "connected to LED strip");

    // Create and start the animator
    let (animator, animator_handle) =
        Animator::new(config.animations_path, config.development, pixels.clone());

    // Create the health reporter
    let (mut reporter, health_service) = health_reporter();
    reporter.set_serving::<lights::Service>().await;

    // Start the server
    info!(address = %config.address, "listening and ready to handle connections");
    Server::builder()
        .trace_fn(|_| info_span!("controller"))
        .add_service(health_service)
        .add_service(lights::service(
            animator.clone(),
            config.leds,
            pixels.clone(),
        ))
        .serve_with_shutdown(config.address, async { signal::ctrl_c().await.unwrap() })
        .await?;

    info!("signal received, shutting down...");
    reporter.set_not_serving::<lights::Service>().await;

    // Stop the animator
    animator.shutdown().await;
    animator_handle.await?;

    // Stop the pixel manager
    pixels.shutdown().await;
    pixels_handle.await?;

    info!("shutdown successful. good bye!");
    Ok(())
}
