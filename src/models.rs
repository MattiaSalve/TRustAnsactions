use csv::StringRecord;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub name: String,
    pub amount: f32,
    pub date: String,
    pub category: String,
    pub balance: f32,
}

#[derive(Serialize, Clone)]
pub struct Transactions(pub Vec<Transaction>);

#[derive(Deserialize)]
pub struct DateFilter {
    pub start: Option<String>,
    pub end: Option<String>,
}

impl Transaction {
    pub fn from_csv_line(line: StringRecord) -> Transaction {
        let mut amount: f32;
        if line[4].to_string().is_empty() {
            amount = line[5].parse().expect("Couldn't parse float from string");
        } else {
            amount = line[4].parse().expect("Couldn't parse float from string");
            amount = -amount;
        }

        let date = line[0].to_string();

        let day = date[..2].parse::<u32>().unwrap();
        let month = date[3..5].parse::<u32>().unwrap();
        let year = date[6..date.len()].parse::<i32>().unwrap();

        let date = chrono::NaiveDate::from_ymd_opt(year, month, day).unwrap();

        Transaction {
            name: line[1].to_string(),
            amount: amount,
            date: date.format("%Y-%m-%d").to_string(),
            category: Transaction::category_from_name(line[1].to_string()),
            balance: line[7].parse().expect("Can't parse amount"),
        }
    }

    pub fn category_from_name(name: String) -> String {
        fn contains_any(text: String, substrings: &[&str]) -> bool {
            substrings.iter().any(|&sub| text.contains(sub))
        }

        let food = &vec!["migro", "coop", "lidl", "aldi", "denner", "steiner"];
        let transporatation = &vec!["sbb", "trenitalia"];
        let shopping = &vec!["aliex", "amzn", "ricardo"];

        match name.to_lowercase() {
            x if x.contains("credit") => String::from("Salary"),
            x if x.contains("martin") => String::from("Rent"),
            x if x.contains("account transfer") => String::from("Joint Account"),
            x if x.contains("revolut") => String::from("Revolut"),
            x if x.contains("eth") => String::from("Uni tuition"),
            x if contains_any(x.clone(), food) => String::from("Food"),
            x if contains_any(x.clone(), transporatation) => String::from("Transportation"),
            x if contains_any(x.clone(), shopping) => String::from("Shopping"),
            _ => String::from("Unknown"),
        }
    }
}

impl Transactions {
    pub fn from_csv(path: &str) -> Transactions {
        let mut rdr = csv::ReaderBuilder::new()
            .delimiter(b';')
            .from_path(path)
            .expect("Couldn't parse file");

        let mut transactions: Vec<Transaction> = Vec::new();

        for result in rdr.records() {
            let record = result.expect("Error parsing line");
            transactions.push(Transaction::from_csv_line(record));
        }

        transactions.reverse();
        Transactions(transactions)
    }

    pub fn query_date(&self, start: &Option<String>, end: &Option<String>) -> Transactions {
        let iter = self
            .0
            .iter()
            .filter(|t| {
                if let Some(start_date) = start {
                    if start_date.is_empty() {
                        true
                    } else {
                        &t.date >= start_date
                    }
                } else {
                    true
                }
            })
            .filter(|t| {
                if let Some(end_date) = end {
                    if end_date.is_empty() {
                        true
                    } else {
                        &t.date <= end_date
                    }
                } else {
                    true
                }
            })
            .cloned()
            .collect();
        Transactions(iter)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_transactions() -> Transactions {
        Transactions(vec![
            Transaction {
                name: "Test1".to_string(),
                amount: 100.0,
                date: "2023-01-15".to_string(),
                category: "Test".to_string(),
                balance: 1000.0,
            },
            Transaction {
                name: "Test2".to_string(),
                amount: 200.0,
                date: "2023-02-20".to_string(),
                category: "Test".to_string(),
                balance: 800.0,
            },
            Transaction {
                name: "Test3".to_string(),
                amount: 300.0,
                date: "2023-03-25".to_string(),
                category: "Test".to_string(),
                balance: 500.0,
            },
        ])
    }

    #[test]
    fn test_query_filter() {
        let transactions = create_test_transactions();
        let result = transactions.query_date(
            &Some("2023-01-01".to_string()),
            &Some("2023-02-30".to_string()),
        );
        assert_eq!(result.0.len(), 2)
    }
}
