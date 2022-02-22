use tonic::transport::Server;

mod config;
mod lights;

use config::Config;

#[tokio::main]
async fn main() {
    let config = Config::load();

    Server::builder()
        .add_service(lights::service())
        .serve(config.address)
        .await
        .unwrap();
}
