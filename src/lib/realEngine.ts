export interface ApiConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model?: string;
}

export interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

/** Call a real LLM through Aria's BYO-key proxy. Throws on failure. */
export async function callReal(
  cfg: ApiConfig,
  system: string,
  prompt: string,
  history: HistoryMsg[] = [],
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cfg, system, prompt, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return (data?.text as string) || "";
}
