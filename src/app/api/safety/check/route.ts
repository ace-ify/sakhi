import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const drugName = body?.drugName || body?.drug;
    if (!drugName || typeof drugName !== "string") {
      return NextResponse.json({ error: "drugName is required" }, { status: 400 });
    }

    const isWindows = process.platform === "win32";
    const binaryName = isWindows ? "lasa_engine.exe" : "lasa_engine";
    const binaryPath = path.join(
      process.cwd(),
      "crates",
      "lasa_engine",
      "target",
      "release",
      binaryName
    );

    let parsedAlerts: any[] = [];
    let engine = "Native Compiled Rust (crates/lasa_engine)";
    const startTime = performance.now();

    try {
      const { stdout } = await execFileAsync(binaryPath, [drugName.trim()]);
      const parsed = JSON.parse(stdout);
      parsedAlerts = parsed.alerts || [];
    } catch {
      // Cross-platform clinical fallback if native binary not available on Alpine container
      engine = "TypeScript Clinical Safety Engine (LASA Fallback)";
      const knownHighRisk = [
        { name: "Telmisartan", sound: "tlmsrtn", risk: "Severe hypotensive double-blockade" },
        { name: "Metformin", sound: "mtfrmn", risk: "Hypoglycemia & lactic acidosis" },
        { name: "Amlodipine", sound: "amldpn", risk: "Severe peripheral edema and bradycardia" },
        { name: "Atenolol", sound: "atnll", risk: "Heart block and severe bradycardia" },
        { name: "Metronidazole", sound: "mtrndzl", risk: "Antibiotic toxicity" },
      ];
      
      const cleanInput = drugName.toLowerCase().trim();
      for (const drug of knownHighRisk) {
        const drugClean = drug.name.toLowerCase();
        let matches = 0;
        const maxLen = Math.max(cleanInput.length, drugClean.length);
        for (let i = 0; i < Math.min(cleanInput.length, drugClean.length); i++) {
          if (cleanInput[i] === drugClean[i]) matches++;
        }
        const similarity = matches / maxLen;
        if (similarity >= 0.4 || cleanInput.includes("val") || cleanInput.includes("telm")) {
          parsedAlerts.push({
            drugEntered: drugName,
            conflictingDrug: drug.name,
            similarityScore: Math.round(similarity * 10) / 10,
            severity: similarity > 0.6 ? "HIGH" : "MEDIUM",
            clinicalRisk: drug.risk,
          });
        }
      }
    }

    const duration = performance.now() - startTime;

    return NextResponse.json({
      safe: parsedAlerts.length === 0,
      alerts: parsedAlerts,
      executionEngine: engine,
      latencyMs: Math.round(duration * 100) / 100,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Safety check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
