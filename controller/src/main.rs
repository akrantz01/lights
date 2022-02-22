use tonic::transport::Server;

mod lights;

#[tokio::main]
async fn main() {
    Server::builder()
        .add_service(lights::service())
        .serve("127.0.0.1:30000".parse().unwrap())
        .await
        .unwrap();
}
