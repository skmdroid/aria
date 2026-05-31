import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Bring-your-own-key proxy. The key never touches Aria's servers in any
 * persistent way — it's passed per-request from the browser and forwarded
 * straight to the chosen provider. Supports OpenAI and Anthropic.
 */
interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
  system: string;
  prompt: string;
  /** optional prior turns for conversational memory */
  history?: Msg[];
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { provider, apiKey, system, prompt } = body;
  const history = (body.history || []).slice(-10);
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 400 });
  }

  try {
    if (provider === "anthropic") {
      const model = body.model || "claude-3-5-haiku-latest";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages: [...history, { role: "user", content: prompt }],
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "Anthropic error" },
          { status: r.status },
        );
      }
      const text =
        data?.content?.map((c: { text?: string }) => c.text || "").join("") ||
        "";
      return NextResponse.json({ text });
    }

    // default: OpenAI
    const model = body.model || "gpt-4o-mini";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: prompt },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI error" },
        { status: r.status },
      );
    }
    const text = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream error" },
      { status: 502 },
    );
  }
}
