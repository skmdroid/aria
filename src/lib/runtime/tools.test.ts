import { describe, it, expect } from "vitest";
import { formatResearch } from "./tools";
import type { SearchResult } from "./types";

describe("formatResearch", () => {
  it("returns a graceful fallback when there are no results", () => {
    const out = formatResearch("quantum widgets", []);
    expect(out.toLowerCase()).toContain("empty-handed");
  });

  it("renders bullets and a sources list with hosts", () => {
    const results: SearchResult[] = [
      {
        title: "Mechanical keyboard",
        snippet: "A keyboard built with individual mechanical switches.",
        url: "https://en.wikipedia.org/wiki/Mechanical_keyboard",
      },
      {
        title: "Switches 101",
        snippet: "Linear, tactile and clicky switches explained.",
        url: "https://example.com/switches",
      },
    ];
    const out = formatResearch("mechanical keyboards", results);
    expect(out).toContain("**Mechanical keyboard**");
    expect(out).toContain("en.wikipedia.org");
    expect(out).toContain("**Sources**");
    expect(out).toContain("[Switches 101](https://example.com/switches)");
  });

  it("truncates very long snippets", () => {
    const long = "x".repeat(400);
    const out = formatResearch("q", [
      { title: "T", snippet: long, url: "https://e.com" },
    ]);
    expect(out).toContain("…");
  });
});
