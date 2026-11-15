export interface LasaAlert {
  drugEntered: string;
  conflictingDrug: string;
  similarityScore: number;
  severity: "HIGH" | "CRITICAL";
  clinicalRisk: string;
}

const pairs = [
  { a: "Metformin", b: "Metronidazole", severity: "CRITICAL", risk: "Hypoglycemia vs antibiotic toxicity misadministration" },
  { a: "Telmisartan", b: "Valsartan", severity: "HIGH", risk: "Severe hypotensive double-blockade" },
  { a: "Amlodipine", b: "Atenolol", severity: "HIGH", risk: "Calcium channel vs beta blocker confusion" },
  { a: "Clonazepam", b: "Clobazam", severity: "CRITICAL", risk: "Excessive sedation and respiratory depression" },
  { a: "Digoxin", b: "Deslanoside", severity: "CRITICAL", risk: "Digitalis toxicity" },
  { a: "Tramadol", b: "Trazodone", severity: "HIGH", risk: "Serotonin syndrome and fall risk" },
] as const;

function similarity(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    previous = current;
  }
  return Math.max(0, 1 - previous[right.length] / Math.max(left.length, right.length));
}

export function checkKnownLasaPairs(drugName: string): LasaAlert[] {
  const base = drugName.trim().split(/\s+/)[0];
  return pairs.flatMap((pair) => {
    const a = similarity(base, pair.a);
    const b = similarity(base, pair.b);
    if (Math.max(a, b) <= 0.65) return [];
    return [{ drugEntered: drugName, conflictingDrug: a > b ? pair.b : pair.a, similarityScore: Math.round(Math.max(a, b) * 100) / 100, severity: pair.severity, clinicalRisk: pair.risk }];
  });
}
