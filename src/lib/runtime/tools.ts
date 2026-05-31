import type { SearchResult, Tool, ToolResult } from "./types";
import { IS_STATIC } from "@/lib/env";

/** Direct, CORS-friendly Wikipedia search — used in the static build (no server). */
async function wikipediaClient(query: string): Promise<{
  results: SearchResult[];
  source: string;
}> {
  const u = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query,
  )}&srlimit=6&format=json&origin=*`;
  const r = await fetch(u);
  if (!r.ok) return { results: [], source: "none" };
  const d = await r.json();
  const results: SearchResult[] = (d?.query?.search || []).map(
    (x: { title: string; snippet: string }) => ({
      title: x.title,
      snippet: x.snippet.replace(/<[^>]+>/g, ""),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(x.title.replace(/ /g, "_"))}`,
    }),
  );
  return { results, source: "wikipedia" };
}

/** Low-level client call to the search backend (server proxy, or direct on static). */
export async function searchWeb(query: string): Promise<{
  results: SearchResult[];
  source: string;
}> {
  if (IS_STATIC) {
    try {
      return await wikipediaClient(query);
    } catch {
      return { results: [], source: "none" };
    }
  }
  try {
    const r = await fetch("/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!r.ok) return { results: [], source: "none" };
    const d = await r.json();
    return { results: d.results || [], source: d.source || "none" };
  } catch {
    return { results: [], source: "none" };
  }
}

/** Render search results as a sourced markdown brief. */
export function formatResearch(query: string, results: SearchResult[]): string {
  if (!results.length) {
    return `Searched the web for **${query}** but came back empty-handed — the live sources had nothing usable. Falling back to reasoning.`;
  }
  const bullets = results
    .map((r) => {
      const snip = r.snippet.length > 220 ? r.snippet.slice(0, 217) + "…" : r.snippet;
      const host = r.url ? r.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "";
      return `• **${r.title}** — ${snip}${host ? ` _(${host})_` : ""}`;
    })
    .join("\n");
  const sources = results
    .filter((r) => r.url)
    .map((r, i) => `${i + 1}. [${r.title}](${r.url})`)
    .join("\n");
  return `Pulled **live** results for **${query}**:\n\n${bullets}\n\n**Sources**\n${sources}`;
}

/* ───────────────────────── Tool registry ───────────────────────── */

export const webSearchTool: Tool<{ query: string }> = {
  name: "web_search",
  description:
    "Search the live web for current, factual information. Returns titles, snippets and source URLs.",
  parameters: {
    query: { type: "string", description: "The search query" },
  },
  async run({ query }): Promise<ToolResult> {
    const { results, source } = await searchWeb(query);
    return {
      ok: results.length > 0,
      summary: results.length
        ? `Found ${results.length} live results (${source})`
        : "No live results found",
      data: results,
    };
  },
};

/* ───────────────────────── Image generation ───────────────────────── */

/**
 * Generate a real image from a text prompt. Keyless by default (Pollinations),
 * so it works on a fresh clone with no setup. Returns a stable image URL.
 */
export function generateImageUrl(prompt: string, seed = 1): string {
  const clean = prompt.replace(/\s+/g, " ").trim().slice(0, 240);
  if (IS_STATIC) {
    // no server proxy on static — go direct
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      clean,
    )}?width=512&height=512&nologo=true&model=turbo&seed=${seed}`;
  }
  // routed through our same-origin proxy to avoid cross-origin image blocking
  return `/api/image?prompt=${encodeURIComponent(clean)}&seed=${seed}`;
}

export const imageGenTool: Tool<{ prompt: string }> = {
  name: "image_gen",
  description: "Generate a real image from a text description.",
  parameters: {
    prompt: { type: "string", description: "What the image should depict" },
  },
  async run({ prompt }): Promise<ToolResult> {
    const url = generateImageUrl(prompt, 1 + Math.floor(Math.random() * 9999));
    return { ok: true, summary: "Generated an image", data: { url } };
  },
};

export const TOOLS: Record<string, Tool> = {
  web_search: webSearchTool as Tool,
  image_gen: imageGenTool as Tool,
};
