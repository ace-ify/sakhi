export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  instructions: string;
}

export interface PrescriptionAnalysis {
  doctorName: string;
  clinicOrHospital: string;
  patientName: string;
  medications: PrescriptionMedicine[];
  precautions: string[];
  followUp: string;
}

function boundedString(value: unknown, field: string, max = 200) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) throw new Error(`Invalid ${field}`);
  return value.trim();
}

export function parsePrescriptionAnalysis(raw: unknown): PrescriptionAnalysis {
  if (typeof raw !== "string") throw new Error("Gemini returned no text");
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let value: unknown;
  try { value = JSON.parse(clean); } catch { throw new Error("Gemini returned invalid JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Gemini returned an invalid prescription");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.medications) || data.medications.length > 30) throw new Error("Gemini returned an invalid medicine list");
  const medications = data.medications.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`Invalid medicine ${index + 1}`);
    const medicine = item as Record<string, unknown>;
    return {
      name: boundedString(medicine.name, "medicine name"),
      dosage: boundedString(medicine.dosage, "dosage"),
      time: boundedString(medicine.time, "time"),
      frequency: boundedString(medicine.frequency, "frequency"),
      instructions: boundedString(medicine.instructions, "instructions", 500),
    };
  });
  if (data.precautions !== undefined && (!Array.isArray(data.precautions) || data.precautions.length > 20)) throw new Error("Invalid precautions");
  const precautions: unknown[] = Array.isArray(data.precautions) ? data.precautions : [];
  return {
    doctorName: boundedString(data.doctorName, "doctor name"),
    clinicOrHospital: boundedString(data.clinicOrHospital, "clinic"),
    patientName: boundedString(data.patientName, "patient name"),
    medications,
    precautions: precautions.map((item) => boundedString(item, "precaution", 500)),
    followUp: boundedString(data.followUp, "follow-up", 500),
  };
}
