FROM rust:1-bookworm
WORKDIR /workspace
ENV CARGO_HOME=/tmp/cargo RUSTUP_HOME=/tmp/rustup
RUN cargo install tauri-cli --version '^2' --locked
