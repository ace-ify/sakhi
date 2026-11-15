use lasa_engine::{evaluate_drug_safety, calculate_adherence};
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!(r#"{{"error":"Usage: lasa_engine <drug_name>"}}"#);
        std::process::exit(1);
    }

    let drug = &args[1];
    let alerts = evaluate_drug_safety(drug);

    let alerts_json: Vec<String> = alerts.iter().map(|a| {
        format!(
            r#"{{"drugEntered":"{}","conflictingDrug":"{}","similarityScore":{},"severity":"{}","clinicalRisk":"{}"}}"#,
            a.drug_entered, a.conflicting_drug, a.similarity_score, a.severity, a.clinical_risk
        )
    }).collect();

    println!(
        r#"{{"drug":"{}","alerts":[{}],"engine":"Native Rust Binary (lasa_engine v0.1.0)"}}"#,
        drug, alerts_json.join(",")
    );
}

