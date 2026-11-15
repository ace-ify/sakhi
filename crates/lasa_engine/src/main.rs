use lasa_engine::evaluate_drug_safety;
use serde_json::json;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!(r#"{{"error":"Usage: lasa_engine <drug_name>"}}"#);
        std::process::exit(1);
    }

    let drug = &args[1];
    let alerts = evaluate_drug_safety(drug);

    println!(
        "{}",
        json!({ "drug": drug, "alerts": alerts, "engine": "Native Rust Binary (lasa_engine v0.1.0)" })
    );
}
