"use client";

import { useState } from "react";
import type { Medication } from "@/lib/medication-store";

type Draft = Pick<Medication, "name" | "dosage" | "time" | "instructions">;

export function PrescriptionReview({ onSave }: { onSave: (medicines: Draft[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function scan() {
    if (!file) return;
    if (file.size > 3_750_000 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Use a JPEG, PNG, or WebP photo smaller than 3.75 MB."); return; }
    setLoading(true);
    setError("");
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image"));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/gemini/analyze-prescription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64 }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed");
      if (!Array.isArray(result.data?.medications)) throw new Error("No medicines could be read. Try a clearer image.");
      setDrafts(result.data.medications.map((item: Record<string, unknown>) => ({ name: typeof item.name === "string" ? item.name : "", dosage: typeof item.dosage === "string" ? item.dosage : "", time: typeof item.time === "string" ? item.time : "", instructions: typeof item.instructions === "string" ? item.instructions : "" })));
      if (!result.data.medications.length) setError("No medicines could be read. Try a clearer image.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-zinc-700 p-4">
    <p className="text-sm">Upload a clear prescription photo. Review every field against the prescription before saving. Enter each dose time as HH:MM AM/PM.</p>
    <input className="mt-4 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setDrafts([]); }} />
    <button type="button" disabled={!file || loading} onClick={scan} className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{loading ? "Reading…" : "Read prescription"}</button>
    {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
    {drafts.map((draft, index) => <fieldset key={index} className="mt-4 space-y-2 rounded-xl border border-zinc-700 p-3">
      <legend className="px-1 text-xs">Medicine {index + 1}</legend>
      {(["name", "dosage", "time", "instructions"] as const).map((field) => <label key={field} className="block text-xs capitalize">{field}<input value={draft[field]} onChange={(event) => setDrafts((current) => current.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item))} className="mt-1 w-full rounded-lg border border-zinc-600 bg-transparent p-2 text-sm" /></label>)}
      <button type="button" onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))} className="text-xs text-rose-400">Remove</button>
    </fieldset>)}
    {drafts.length > 0 && <button type="button" disabled={drafts.some((item) => !item.name.trim() || !item.dosage.trim() || !/^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i.test(item.time.trim()))} onClick={() => onSave(drafts.map((item) => ({ ...item, name: item.name.trim(), dosage: item.dosage.trim(), time: item.time.trim(), instructions: item.instructions.trim() })))} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm and add to schedule</button>}
  </div>;
}
