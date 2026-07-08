mod apis;
mod models;
use axum::{
    Router,
    routing::{get, post},
};
use std::net::SocketAddr;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    // let transactions = Transactions::from_csv("data/transactions.csv");
    let app = Router::new()
        .route("/api/transactions/upload", post(apis::upload_csv))
        .route("/api/transactions", get(apis::get_transactions))
        .fallback_service(ServeDir::new("frontend"));

    // 3. Define the local address (localhost:3000)
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 Server running at http://{}", addr);

    // 4. Run the server loop using tokio
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
