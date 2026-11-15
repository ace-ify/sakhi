import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, language = "hi" } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are Sakhi (सखी), a loving, gentle, and respectful voice companion for elderly Indian grandparents (Dadi ji).
Language mode: ${language === "hi" ? "Polite conversational Hindi (e.g. 'नमस्ते दादी जी', 'जी दादी')" : "Warm conversational English"}.
Current Patient Profile: Prabha Devi, 72 years old.
Current Medication Regimen:
1. Telmisartan 40mg (Morning 09:00 AM, post breakfast with water) - Taken today.
2. Metformin 500mg (Afternoon 01:30 PM, post lunch) - Due later today.
3. Calcium D3 500mg (Night 09:00 PM, before bed with milk) - Due tonight.
Upcoming Appointment: Dr. Arvind Sharma (Cardiologist) tomorrow at 10:30 AM at Max Hospital, Saket.
Emergency Contact: Son Prashant (+91 98765 43210).

Guidelines:
- Keep your answers short (1 to 2 spoken sentences maximum).
- Speak with warmth, respect ('दादी जी', 'आप'), and clarity.
- Never output markdown, asterisks, or bullet points because this text will be read aloud by Text-to-Speech.`;

    // 1. Try Google Gemini Flash if API key is present
    if (geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\nUser asked: "${message}"\nSakhi response:` }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 100,
              temperature: 0.4,
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return NextResponse.json({ reply, provider: "Google Gemini 2.5 Flash" });
          }
        }
      } catch (err) {
        console.warn("Gemini chat API error:", err);
      }
    }

    // 2. Try Groq Llama 3.3 if API key is present
    if (groqApiKey) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            max_tokens: 100,
            temperature: 0.4,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (reply) {
            return NextResponse.json({ reply, provider: "Groq Llama 3.3 70B" });
          }
        }
      } catch (err) {
        console.warn("Groq chat API error:", err);
      }
    }

    // 3. Fallback deterministic conversational answers
    const lower = message.toLowerCase();
    let fallback = language === "hi"
      ? "जी दादी, आपकी सुबह की बीपी दवा टेल्मिसर्टन 40mg ले ली गई है। ध्यान रखें!"
      : "Yes Dadi, your morning BP medicine Telmisartan 40mg has been marked taken. Take care!";

    if (lower.includes("doctor") || lower.includes("appointment") || lower.includes("डॉक्टर") || lower.includes("अस्पताल")) {
      fallback = language === "hi"
        ? "दादी जी, डॉ. अरविंद शर्मा से आपकी मुलाकात कल सुबह 10:30 बजे मैक्स अस्पताल में है।"
        : "Dadi, your visit with Dr. Arvind Sharma is scheduled for tomorrow at 10:30 AM at Max Hospital.";
    } else if (lower.includes("दवा") || lower.includes("medicine") || lower.includes("bp") || lower.includes("बीपी")) {
      fallback = language === "hi"
        ? "दादी, आपकी अगली दवा मेटफॉर्मिन 500mg दोपहर 1:30 बजे खाने के बाद है।"
        : "Dadi, your next medication is Metformin 500mg at 1:30 PM after lunch.";
    }

    return NextResponse.json({ reply: fallback, provider: "Sakhi Built-in Clinical NLP" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
