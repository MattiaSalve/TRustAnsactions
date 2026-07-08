use crate::models::*;
use axum::{
    Json,
    extract::{Multipart, Query},
    http::StatusCode,
};

pub async fn get_transactions(Query(filter): Query<DateFilter>) -> Json<Transactions> {
    let transactions =
        Transactions::from_csv("data/transactions.csv").query_date(&filter.start, &filter.end);

    Json(transactions)
}

pub async fn upload_csv(mut multipart: Multipart) -> Result<StatusCode, StatusCode> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        if let Some("file") = field.name() {
            let bytes = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;

            std::fs::write("data/transactions.csv", bytes).map_err(|err| {
                eprintln!("Failed to write uploaded CSV to disk: {}", err);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        }
        println!("Succesfully uploaded csv");
        return Ok(StatusCode::OK);
    }
    Err(StatusCode::BAD_REQUEST)
}
