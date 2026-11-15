import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { checkKnownLasaPairs, type LasaAlert } from "@/lib/lasa-check";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const drugName = body?.drugName || body?.drug;
    if (typeof drugName !== "string" || !drugName.trim() || drugName.length > 80) {
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

    let parsedAlerts: LasaAlert[];
    let engine = "Native Rust LASA Engine";
    const startTime = performance.now();

    try {
      const { stdout } = await execFileAsync(binaryPath, [drugName.trim()]);
      const parsed: unknown = JSON.parse(stdout);
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { alerts?: unknown }).alerts)) throw new Error("Invalid engine response");
      parsedAlerts = (parsed as { alerts: LasaAlert[] }).alerts;
    } catch {
      engine = "TypeScript Known-Pair LASA Engine";
      parsedAlerts = checkKnownLasaPairs(drugName.trim());
    }

    const duration = performance.now() - startTime;

    return NextResponse.json({
      noKnownConflict: parsedAlerts.length === 0,
      scope: "Known look-alike/sound-alike medicine names only; not a clinical safety clearance",
      alerts: parsedAlerts,
      executionEngine: engine,
      latencyMs: Math.round(duration * 100) / 100,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Safety check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
