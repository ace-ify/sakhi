import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const { drugName } = await req.json();
    if (!drugName || typeof drugName !== "string") {
      return NextResponse.json({ error: "drugName is required" }, { status: 400 });
    }

    const binaryPath = path.join(
      process.cwd(),
      "crates",
      "lasa_engine",
      "target",
      "release",
      "lasa_engine.exe"
    );

    const startTime = performance.now();
    const { stdout } = await execFileAsync(binaryPath, [drugName.trim()]);
    const duration = performance.now() - startTime;

    const parsed = JSON.parse(stdout);

    return NextResponse.json({
      safe: parsed.alerts.length === 0,
      alerts: parsed.alerts,
      executionEngine: "Native Compiled Rust 1.99.1 (crates/lasa_engine)",
      latencyMs: Math.round(duration * 100) / 100,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Safety check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
