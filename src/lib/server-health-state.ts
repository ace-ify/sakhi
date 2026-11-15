import { validateSharedHealthState, type SharedHealthState } from "./health-state-validator";
export type { SharedHealthState } from "./health-state-validator";

export async function redisCommand(command: Array<string | number>) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Shared storage is not configured");
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command), cache: "no-store" });
  if (!response.ok) throw new Error(`Shared storage returned ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error("Shared storage command failed");
  return payload.result;
}

export async function readHealthState(): Promise<SharedHealthState | null> {
  const raw = await redisCommand(["GET", "sakhi:health:demo"]);
  return typeof raw === "string" ? validateSharedHealthState(JSON.parse(raw)) : null;
}

export async function writeHealthState(state: SharedHealthState) {
  await redisCommand(["SET", "sakhi:health:demo", JSON.stringify(state)]);
}
