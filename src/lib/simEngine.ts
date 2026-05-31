import { nanoid } from "nanoid";
import type { AgentId, Subtask } from "./types";

/**
 * The offline "brain". It plans a mission into subtasks and generates
 * believable, prompt-aware output for each agent. No network, no key — this is
 * what makes the repo feel alive the moment you clone it.
 */

interface Intent {
  agent: AgentId;
  title: (p: string) => string;
  match: RegExp;
}

const INTENTS: Intent[] = [
  {
    agent: "forge",
    match: /\b(code|build|app|script|function|api|bug|implement|program|website|component|backend|frontend|deploy)\b/i,
    title: () => "Design the system and write the code",
  },
  {
    agent: "iris",
    match: /\b(design|ui|ux|logo|brand|color|colour|layout|interface|landing|figma|aesthetic|theme)\b/i,
    title: () => "Shape the visual design and interface",
  },
  {
    agent: "ledger",
    match: /\b(data|numbers|forecast|revenue|analy|metric|chart|growth|cost|price|pricing|budget|roi|kpi)\b/i,
    title: () => "Model the numbers and surface the signal",
  },
  {
    agent: "quill",
    match: /\b(write|blog|email|copy|post|essay|story|article|caption|script|readme|docs|documentation|pitch|tweet)\b/i,
    title: () => "Write the deliverable",
  },
  {
    agent: "sage",
    match: /\b(research|find|compare|best|options|market|competitor|study|investigate|explore|trend|review)\b/i,
    title: () => "Research the landscape and gather facts",
  },
];

function shortTitle(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  const clipped = t.length > 64 ? t.slice(0, 61) + "…" : t;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

/** Build a sensible plan: Atlas always leads, Echo always reviews. */
export function planMission(prompt: string): {
  title: string;
  subtasks: Subtask[];
} {
  const matched: { agent: AgentId; title: string }[] = [];
  for (const intent of INTENTS) {
    if (intent.match.test(prompt)) {
      matched.push({ agent: intent.agent, title: intent.title(prompt) });
    }
  }
  // Always at least research → it grounds everything.
  if (!matched.some((m) => m.agent === "sage")) {
    matched.unshift({
      agent: "sage",
      title: "Research the landscape and gather facts",
    });
  }
  // De-dupe by agent, cap to keep the board readable.
  const seen = new Set<AgentId>();
  const core = matched
    .filter((m) => (seen.has(m.agent) ? false : (seen.add(m.agent), true)))
    .slice(0, 4);

  const atlasId = nanoid(6);
  const subtasks: Subtask[] = [];

  subtasks.push({
    id: atlasId,
    agentId: "atlas",
    title: "Decompose the mission and brief the team",
    status: "queued",
    output: "",
    deps: [],
  });

  const coreIds: string[] = [];
  for (const m of core) {
    const id = nanoid(6);
    coreIds.push(id);
    subtasks.push({
      id,
      agentId: m.agent,
      title: m.title,
      status: "queued",
      output: "",
      deps: [atlasId],
    });
  }

  subtasks.push({
    id: nanoid(6),
    agentId: "echo",
    title: "Review the work for gaps and risk",
    status: "queued",
    output: "",
    deps: coreIds,
  });

  return { title: shortTitle(prompt), subtasks };
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function keywords(prompt: string): string {
  const stop = new Set([
    "the", "a", "an", "and", "or", "to", "for", "of", "in", "on", "with",
    "that", "this", "make", "build", "create", "me", "my", "i", "is", "are",
    "can", "you", "please", "want", "need", "should", "would", "about",
  ]);
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const top = [...new Set(words)].slice(0, 3);
  return top.length ? top.join(", ") : "the objective";
}

/** Generate believable, prompt-aware output for a given agent + subtask. */
export function simulateOutput(agentId: AgentId, prompt: string): string {
  const kw = keywords(prompt);
  const subject = shortTitle(prompt).replace(/[.…]+$/, "");

  switch (agentId) {
    case "atlas":
      return [
        `Mission received: "${subject}".`,
        ``,
        `I've broken this into a parallelizable plan around **${kw}**. Here's how I'm routing it:`,
        `• Ground the work in real context first (Sage).`,
        `• Hand the core build to the best-fit specialist.`,
        `• Close with a hard review pass (Echo) before we ship.`,
        ``,
        `Team is briefed. Dispatching now. ⚡`,
      ].join("\n");

    case "sage":
      return [
        `Researched **${kw}**. Key findings:`,
        ``,
        `• ${pick([
          "The space is crowded but the top players share one obvious weakness",
          "Most existing solutions over-complicate the core job",
          "There's a clear, underserved segment hiding in plain sight",
          "The fundamentals are well understood; execution is where things break",
        ])}.`,
        `• ${pick([
          "Best-in-class examples lean hard on simplicity and speed",
          "Users consistently reward trust and clarity over feature count",
          "The data points to mobile-first, low-friction onboarding",
          "Pricing tolerance is higher than the incumbents assume",
        ])}.`,
        `• Caveat: ${pick([
          "sample is directional, not exhaustive — validate before betting big",
          "two sources disagreed on adoption numbers; I flagged the conflict",
          "the trend is recent, so confidence is moderate",
        ])}.`,
        ``,
        `Handing structured context to the build team.`,
      ].join("\n");

    case "forge":
      return [
        `Engineering pass on **${kw}**. I wrote a working prototype and ran it:`,
        ``,
        "```js",
        `// self-contained, runnable`,
        `function rank(items) {`,
        `  return items`,
        `    .map((x) => ({ name: x, score: (x.length * 7) % 13 }))`,
        `    .sort((a, b) => b.score - a.score);`,
        `}`,
        `const ranked = rank(["alpha", "beta", "gamma", "delta", "epsilon"]);`,
        `console.log("ranked:", ranked.map((r) => r.name + ":" + r.score).join(", "));`,
        `return ranked.length + " items ranked";`,
        "```",
        ``,
        `Built it to be boring and robust over clever.`,
      ].join("\n");

    case "quill":
      return [
        `Draft for **${kw}**:`,
        ``,
        `> ${pick([
          "It shouldn't take ten taps and a tutorial to do one simple thing.",
          "The best tool is the one you forget you're using.",
          "We removed everything that wasn't the point — and the point got louder.",
        ])}`,
        ``,
        `${pick([
          "Clear, warm, confident — no jargon, no filler",
          "Short sentences. Strong verbs. A rhythm you can read out loud",
          "Leads with the benefit, earns the detail",
        ])}. Tone matches the brief.`,
        ``,
        `Two alternate openers are in the file if you want a different angle.`,
      ].join("\n");

    case "iris":
      return [
        `Design direction for **${kw}**:`,
        ``,
        `• Layout: ${pick([
          "generous negative space, one clear focal point per screen",
          "a calm grid that lets the content breathe",
          "progressive disclosure — show little, reveal on intent",
        ])}.`,
        `• Palette: deep near-black base, a single confident accent, restrained gradients.`,
        `• Motion: ${pick([
          "fast, springy, never blocking — feedback under 200ms",
          "subtle parallax and ease-out everywhere; nothing linear",
          "micro-interactions that reward, never distract",
        ])}.`,
        ``,
        `It should feel premium and quiet, not loud. Specs handed to Forge.`,
      ].join("\n");

    case "ledger":
      return [
        `Ran the numbers on **${kw}**.`,
        ``,
        `• Assumption: ${pick([
          "moderate adoption curve, conservative conversion",
          "flat costs, linear traffic growth",
          "10% MoM compounding with a 6-week ramp",
        ])}.`,
        `• Sensitivity: the outcome swings most on ${pick([
          "retention, not acquisition",
          "price, not volume",
          "activation rate in week one",
        ])}.`,
        `• Bottom line: **${pick([
          "~3.4x ROI",
          "break-even by month 4",
          "+$2.1k/mo at the base case",
        ])}** — the single number that should drive the decision.`,
      ].join("\n");

    case "echo":
      return [
        `Review of the work on **${kw}**. Verdict: ${pick([
          "ship-ready with two caveats",
          "solid, but one assumption needs a second look",
          "strong — minor polish before it's done",
        ])}.`,
        ``,
        `• Weakest link: ${pick([
          "the plan assumes the happy path; the failure mode is undefined",
          "no fallback if the primary source is wrong",
          "edge case at scale wasn't addressed",
        ])}.`,
        `• Missing: ${pick([
          "a measurable success metric",
          "an explicit owner for follow-up",
          "a rollback plan",
        ])}.`,
        `• Risk I'd watch: ${pick([
          "scope creep — the elegant version is smaller",
          "over-fitting to one user type",
          "the timeline is optimistic by ~30%",
        ])}.`,
        ``,
        `Nothing blocking. Cleared to deliver.`,
      ].join("\n");
  }
}

/** Aria's final synthesis spoken back to the user. */
export function synthesize(prompt: string): string {
  const subject = shortTitle(prompt).replace(/[.…]+$/, "");
  return [
    `Done. The team finished **${subject}**.`,
    ``,
    `Atlas planned it, Sage grounded it, the specialists built it, and Echo signed off. The full breakdown and any artifacts are saved to **Files** — open the Agents app to replay exactly who did what.`,
    ``,
    `Want me to take it further, or spin up a new mission?`,
  ].join("\n");
}

export interface ChatContext {
  name?: string;
  lastMissionTitle?: string;
  missionsCount?: number;
  filesCount?: number;
}

/** Try to extract a name the user just told us. */
export function extractName(prompt: string): string | undefined {
  const m = prompt.match(
    /\b(?:my name is|i am|i'm|call me|this is)\s+([A-Z][a-zA-Z]{1,20})\b/i,
  );
  if (!m) return undefined;
  const n = m[1];
  // avoid false positives like "i'm good", "i'm here"
  if (/^(good|fine|here|done|back|ready|okay|ok|sorry|trying)$/i.test(n))
    return undefined;
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Short conversational replies for plain chat (no mission), now context-aware. */
export function smallTalk(prompt: string, ctx: ChatContext = {}): string {
  const p = prompt.toLowerCase();
  const who = ctx.name ? `, ${ctx.name}` : "";

  const justGaveName = extractName(prompt);
  if (justGaveName)
    return `Nice to meet you, ${justGaveName}. I'll remember that. Give me a goal and I'll put the whole team on it — try “research the best note-taking apps” or “build me a landing page”.`;

  if (/\b(what('| i)?s my name|who am i|do you remember me|my name)\b/.test(p))
    return ctx.name
      ? `You're ${ctx.name} — of course I remember. What are we building?`
      : "You haven't told me your name yet — say “I'm …” and I'll remember it.";

  if (/\b(what did|recap|summar|last mission|what have we|earlier)\b/.test(p))
    return ctx.lastMissionTitle
      ? `Most recently the team worked on **${ctx.lastMissionTitle}**. The full breakdown and ${ctx.filesCount || 0} artifact(s) are saved in **Files** — want me to build on it?`
      : "We haven't run a mission yet this session. Give me a goal and I'll dispatch the team.";

  if (/\b(hi|hello|hey|yo|good morning|good evening)\b/.test(p))
    return `Hey${who} — I'm Aria. Give me a mission and I'll put the whole team on it. Try “research the best note-taking apps” or “build me a landing page”.`;
  if (/\b(who are you|what are you|what can you do)\b/.test(p))
    return "I'm Aria, an AI operating system. I run a team of seven specialist agents — Atlas plans, Sage researches, Forge codes, Quill writes, Iris designs, Ledger analyzes, and Echo reviews. Hand me anything and watch them collaborate live in the Agents app.";
  if (/\b(thanks|thank you|nice|cool|awesome|great)\b/.test(p))
    return `Anytime${who}. The team's standing by whenever you've got the next one. ✨`;
  if (/\b(help|how do|what should)\b/.test(p))
    return "Open Spotlight (⌘K) to jump anywhere, tap the mic to talk to me, or just type a goal. The bigger and messier the ask, the more the team shines.";
  return `Got it${who}. If you want the agents to actually work on that, phrase it as a goal — like “research…”, “build…”, “write…”, or “design…” — and I'll dispatch the team.`;
}

/** Heuristic: does this message deserve a full agent mission, or just a reply? */
export function isMission(prompt: string): boolean {
  if (prompt.trim().length < 12) return false;
  return /\b(research|build|write|design|code|create|make|plan|analy|compare|find|draft|model|implement|generate)\b/i.test(
    prompt,
  );
}
