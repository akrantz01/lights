fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=../lights.proto");

    tonic_build::configure()
        .build_client(false)
        .build_server(true)
        .format(true)
        .compile(&["../lights.proto"], &[".."])?;

    Ok(())
}
