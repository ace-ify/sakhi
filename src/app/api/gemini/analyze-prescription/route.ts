import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY environment variable is missing" },
      { status: 500 }
    );
  }

  try {
    const { prescriptionText, imageBase64 } = await req.json();

    const prompt = `You are a clinical pharmacology AI assistant specialized in Indian geriatric prescription parsing (Parcha analysis).
Analyze the following prescription text or image data and extract the structured regimen.
Respond ONLY with a valid JSON object matching this schema, with no markdown code fences:
{
  "doctorName": "Doctor name or Dr. Arvind Sharma if unspecified",
  "clinicOrHospital": "Hospital or clinic name",
  "patientName": "Patient name or Prabha Devi",
  "medications": [
    {
      "name": "Drug trade name",
      "dosage": "Strength e.g. 40mg",
      "time": "Scheduled time e.g. 09:00 AM",
      "frequency": "OD / BD / TDS",
      "instructions": "Specific guidance e.g. After breakfast with water"
    }
  ],
  "precautions": ["Key geriatric safety warning e.g. Monitor blood pressure weekly"],
  "followUp": "Follow-up timeline"
}

Prescription Content:
${prescriptionText || "Rx: Tab Telmisartan 40mg 1-0-0 (Morning post breakfast), Tab Metformin 500mg 0-1-0 (Lunch), Tab Calcium D3 0-0-1 (Night with warm milk). Advice: Low sodium diet, BP check at 5 PM."}
`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: prompt },
    ];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
        },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: parsed,
      engine: "Google Gemini 2.5 Flash",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Prescription analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
