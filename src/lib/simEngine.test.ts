import { describe, it, expect } from "vitest";
import {
  planMission,
  isMission,
  extractName,
  smallTalk,
} from "./simEngine";

describe("planMission", () => {
  it("always leads with Atlas and ends with Echo", () => {
    const { subtasks } = planMission("research the best note apps");
    expect(subtasks[0].agentId).toBe("atlas");
    expect(subtasks[subtasks.length - 1].agentId).toBe("echo");
  });

  it("always includes a research step", () => {
    const { subtasks } = planMission("write a poem about the sea");
    expect(subtasks.some((t) => t.agentId === "sage")).toBe(true);
  });

  it("routes coding goals to Forge", () => {
    const { subtasks } = planMission("build an api to manage todos");
    expect(subtasks.some((t) => t.agentId === "forge")).toBe(true);
  });

  it("routes design goals to Iris", () => {
    const { subtasks } = planMission("design a landing page UI");
    expect(subtasks.some((t) => t.agentId === "iris")).toBe(true);
  });

  it("wires Echo to depend on the core specialists", () => {
    const { subtasks } = planMission("build and design a dashboard");
    const echo = subtasks.find((t) => t.agentId === "echo")!;
    const coreIds = subtasks
      .filter((t) => t.agentId !== "atlas" && t.agentId !== "echo")
      .map((t) => t.id);
    expect(echo.deps).toEqual(coreIds);
  });

  it("derives a title from the prompt", () => {
    const { title } = planMission("compare crm tools for startups");
    expect(title.toLowerCase()).toContain("compare");
  });

  it("caps the specialist roster so the board stays readable", () => {
    const { subtasks } = planMission(
      "research, design, build, write, and analyze a pricing strategy",
    );
    const core = subtasks.filter(
      (t) => t.agentId !== "atlas" && t.agentId !== "echo",
    );
    expect(core.length).toBeLessThanOrEqual(4);
  });
});

describe("isMission", () => {
  it("treats goal-shaped prompts as missions", () => {
    expect(isMission("research the best laptops")).toBe(true);
    expect(isMission("build me a website")).toBe(true);
  });
  it("treats chatter as not-a-mission", () => {
    expect(isMission("hi there")).toBe(false);
    expect(isMission("thanks")).toBe(false);
  });
});

describe("extractName", () => {
  it("pulls a name from common phrasings", () => {
    expect(extractName("my name is Sam")).toBe("Sam");
    expect(extractName("I'm Priya")).toBe("Priya");
    expect(extractName("call me Alex")).toBe("Alex");
  });
  it("ignores false positives", () => {
    expect(extractName("i'm good thanks")).toBeUndefined();
    expect(extractName("hello there")).toBeUndefined();
  });
});

describe("smallTalk", () => {
  it("uses the remembered name in a greeting", () => {
    expect(smallTalk("hey", { name: "Sam" })).toContain("Sam");
  });
  it("answers the name question from memory", () => {
    expect(smallTalk("what's my name?", { name: "Priya" })).toContain("Priya");
  });
  it("recaps the last mission when asked", () => {
    const r = smallTalk("what did we do earlier?", {
      lastMissionTitle: "Compare CRMs",
      filesCount: 3,
    });
    expect(r).toContain("Compare CRMs");
  });
});
