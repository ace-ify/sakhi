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

    if ((!prescriptionText || typeof prescriptionText !== "string" || !prescriptionText.trim()) &&
        (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.trim())) {
      return NextResponse.json({ error: "Provide a prescription image or text." }, { status: 400 });
    }

    const prompt = `You are a clinical pharmacology AI assistant specialized in Indian geriatric prescription parsing (Parcha analysis).
Analyze the following prescription text or image data and extract the structured regimen.
Never guess or invent medication names, strengths, instructions, or times. Use an empty string for anything unclear. Create a separate medication entry for each explicitly prescribed daily dose time. If a time is not explicit, leave it empty for the caregiver to enter. If the image is unreadable return an empty medications array.
Respond ONLY with a valid JSON object matching this schema, with no markdown code fences:
{
  "doctorName": "Doctor name, or empty string if unclear",
  "clinicOrHospital": "Hospital or clinic name",
  "patientName": "Patient name, or empty string if unclear",
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
${prescriptionText || "See the attached image."}
`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: prompt },
    ];

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match || imageBase64.length > 5_000_000) {
        return NextResponse.json({ error: "Use a JPEG, PNG or WebP image smaller than 3.75 MB." }, { status: 400 });
      }
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
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

