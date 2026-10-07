import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "../../../lib/server";

function isTemporarilyUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const metadata = error as { status?: unknown; code?: unknown; message?: unknown };
  // An explicit HTTP status takes precedence over message text.
  const status = Number(metadata.status);
  if (Number.isFinite(status) && status >= 400) return status === 503 || status === 504;
  const code = Number(metadata.code);
  if (Number.isFinite(code) && code >= 400) return code === 503 || code === 504;
  const temporaryStatuses = ["UNAVAILABLE", "DEADLINE_EXCEEDED"];
  if (temporaryStatuses.includes(String(metadata.status)) || temporaryStatuses.includes(String(metadata.code))) return true;
  // The SDK can include the structured Google API error in its message.
  if (typeof metadata.message === "string") {
    try {
      const details = JSON.parse(metadata.message)?.error;
      if (typeof details?.code === "number") return details.code === 503 || details.code === 504;
      return temporaryStatuses.includes(details?.status);
    } catch {
      return temporaryStatuses.includes(metadata.message.trim());
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Please sign in to cook up a joke." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Please send a valid prompt." }, { status: 400 });
    }
    const prompt = body?.prompt;
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000) {
      return NextResponse.json({ error: "Please enter a prompt of 1–2,000 characters." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "The kitchen isn’t ready yet. Please try again later." }, { status: 503 });
    }

    let generatedText = "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const generate = (model: string) => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "Generate exactly ONE short joke or caption with the user's original prompt as the main topic. Aim for witty, dry, internet-aware humor suited to a college student audience: a specific observation, an unexpected turn, and a sharp payoff rather than a generic pun. Reference NYC, dorm life, cooking, school, dating, commuting, or everyday chaos only when relevant to the prompt; do not force these topics. A playful cooking or dessert touch is welcome when it fits. Avoid generic dad jokes unless the user specifically asks for one. Make it clever enough that someone would actually want to Like it instead of Boo it, without mentioning voting. Keep it concise: 1–3 sentences, ideally under 50 words. Return only the final joke or caption. Do not explain the joke, add an introduction such as 'Here's a joke', include hashtags, or put quotation marks around the final output.",
          maxOutputTokens: 512,
          httpOptions: { timeout: 30000 },
        },
      });
      async function generateWithRetries(model: string) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await generate(model);
          } catch (error) {
            if (attempt === 2 || !isTemporarilyUnavailable(error)) throw error;
            await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
          }
        }
      }

      let response;
      try {
        response = await generateWithRetries("gemini-3.8-flash");
      } catch (error) {
        if (!isTemporarilyUnavailable(error)) throw error;
        response = await generateWithRetries("gemini-3.5-flash-lite");
      }
      generatedText = response.text?.trim() ?? "";
    } catch (error) {
      const metadata = error && typeof error === "object"
        ? error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown }
        : {};
      const redact = (value: unknown) => {
        if (typeof value !== "string") return typeof value === "number" ? value : undefined;
        return value
          .split(apiKey).join("[REDACTED]")
          .split(encodeURIComponent(apiKey)).join("[REDACTED]")
          .replace(/([?&](?:key|api_key)=)[^\s&#"']+/gi, "$1[REDACTED]")
          .replace(/(x-goog-api-key["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi, "$1[REDACTED]");
      };
      console.error("Gemini generation failed", {
        name: redact(metadata.name),
        message: redact(metadata.message ?? (typeof error === "string" ? error : "Unknown Gemini error")),
        status: redact(metadata.status),
        code: redact(metadata.code),
      });
      return NextResponse.json({ error: "The AI kitchen is having trouble. Please try again in a moment." }, { status: 502 });
    }
    if (!generatedText) {
      return NextResponse.json({ error: "No joke came out of the oven. Try a different prompt." }, { status: 502 });
    }

    const { error: insertError } = await supabase.from("generations").insert({
      user_id: user.id,
      prompt,
      generated_text: generatedText,
      created_at: new Date().toISOString(),
    });
    if (insertError) {
      return NextResponse.json({ error: "Your joke was cooked, but we couldn’t save it. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong in the kitchen. Please try again." }, { status: 500 });
  }
}
