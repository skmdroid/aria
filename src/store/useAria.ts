"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  AgentId,
  AgentMessage,
  ChatMessage,
  FileDoc,
  Mission,
  Subtask,
} from "@/lib/types";
import { AGENTS } from "@/lib/agents";
import {
  extractName,
  isMission,
  planMission,
  simulateOutput,
  smallTalk,
  synthesize,
} from "@/lib/simEngine";
import { callReal } from "@/lib/realEngine";
import { searchWeb, formatResearch } from "@/lib/runtime/tools";
import { runJs } from "@/lib/runtime/exec";
import { useOS } from "./useOS";
import { speak } from "@/lib/voice";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Stream `full` out in small chunks, calling onChunk with the text-so-far. */
async function typeStream(
  full: string,
  onChunk: (soFar: string) => void,
  charsPer = 5,
  delay = 14,
) {
  let i = 0;
  while (i < full.length) {
    i = Math.min(full.length, i + charsPer);
    onChunk(full.slice(0, i));
    await sleep(delay);
  }
}

const FILE_FOR: Partial<Record<AgentId, { kind: FileDoc["kind"]; name: string }>> = {
  sage: { kind: "md", name: "research.md" },
  forge: { kind: "code", name: "solution.ts" },
  quill: { kind: "md", name: "draft.md" },
  iris: { kind: "note", name: "design-notes.md" },
  ledger: { kind: "data", name: "analysis.md" },
};

interface AriaState {
  chat: ChatMessage[];
  missions: Mission[];
  files: FileDoc[];
  bus: AgentMessage[];
  agentStatus: Record<AgentId, "idle" | "working" | "done">;
  activeMissionId: string | null;
  tokens: number;
  busy: boolean;
  memory: { name?: string };

  sendChat: (text: string, spoken?: boolean) => Promise<void>;
  runMission: (prompt: string) => Promise<string>;
  clearChat: () => void;
  removeFile: (id: string) => void;
  addNote: (name: string, content: string) => string;
  updateFile: (id: string, patch: { name?: string; content?: string }) => void;
  reset: () => void;
}

const idleStatus = (): Record<AgentId, "idle" | "working" | "done"> => ({
  atlas: "idle",
  sage: "idle",
  forge: "idle",
  quill: "idle",
  iris: "idle",
  ledger: "idle",
  echo: "idle",
});

export const useAria = create<AriaState>()(
  persist(
    (set, get) => ({
      chat: [
        {
          id: "welcome",
          role: "aria",
          text: "Hi, I'm Aria — your AI operating system. Give me a goal and I'll put my team of seven agents on it. Try “research the best mechanical keyboards” or “build me a pricing page”.",
          ts: Date.now(),
        },
      ],
      missions: [],
      files: [],
      bus: [],
      agentStatus: idleStatus(),
      activeMissionId: null,
      tokens: 0,
      busy: false,
      memory: {},

      clearChat: () =>
        set({
          chat: [
            {
              id: nanoid(8),
              role: "aria",
              text: "Fresh start. What are we building?",
              ts: Date.now(),
            },
          ],
        }),

      removeFile: (id) =>
        set((s) => ({ files: s.files.filter((f) => f.id !== id) })),

      addNote: (name, content) => {
        const id = nanoid(8);
        set((s) => ({
          files: [
            {
              id,
              name,
              kind: "note",
              content,
              createdBy: "you",
              ts: Date.now(),
            },
            ...s.files,
          ],
        }));
        return id;
      },

      updateFile: (id, patch) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),

      reset: () =>
        set({
          missions: [],
          files: [],
          bus: [],
          agentStatus: idleStatus(),
          activeMissionId: null,
          tokens: 0,
        }),

      sendChat: async (text, spoken = false) => {
        const trimmed = text.trim();
        if (!trimmed || get().busy) return;
        const os = useOS.getState();

        // lightweight memory: remember a name the user shares
        const captured = extractName(trimmed);
        if (captured) set((s) => ({ memory: { ...s.memory, name: captured } }));

        const userMsg: ChatMessage = {
          id: nanoid(8),
          role: "user",
          text: trimmed,
          ts: Date.now(),
        };
        const ariaMsg: ChatMessage = {
          id: nanoid(8),
          role: "aria",
          text: "",
          ts: Date.now() + 1,
          streaming: true,
        };
        set((s) => ({ chat: [...s.chat, userMsg, ariaMsg], busy: true }));

        const patchAria = (txt: string) =>
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === ariaMsg.id ? { ...m, text: txt } : m,
            ),
          }));
        const finishAria = (missionId?: string) =>
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === ariaMsg.id
                ? { ...m, streaming: false, missionId }
                : m,
            ),
          }));

        if (isMission(trimmed)) {
          const ack =
            "On it — briefing the team now. Open the **Agents** app to watch them work. I'll report back when it's done.";
          await typeStream(ack, patchAria);
          finishAria();
          os.openApp("agents");
          if (spoken && os.settings.voiceEnabled) speak(ack);

          const result = await get().runMission(trimmed);

          // Aria reports the synthesis as a follow-up message.
          const followId = nanoid(8);
          set((s) => ({
            chat: [
              ...s.chat,
              {
                id: followId,
                role: "aria",
                text: "",
                ts: Date.now(),
                streaming: true,
              },
            ],
          }));
          await typeStream(result, (txt) =>
            set((s) => ({
              chat: s.chat.map((m) =>
                m.id === followId ? { ...m, text: txt } : m,
              ),
            })),
          );
          set((s) => ({
            chat: s.chat.map((m) =>
              m.id === followId ? { ...m, streaming: false } : m,
            ),
            busy: false,
          }));
          if (spoken && os.settings.voiceEnabled) speak(result);
          return;
        }

        // plain conversational reply — now with memory + context
        const ctx = {
          name: get().memory.name,
          lastMissionTitle: get().missions[0]?.title,
          missionsCount: get().missions.length,
          filesCount: get().files.length,
        };
        const history = get()
          .chat.filter(
            (m) => m.id !== ariaMsg.id && m.id !== userMsg.id && !!m.text,
          )
          .slice(-8)
          .map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: m.text,
          }));

        let reply: string;
        if (os.settings.useReal && os.settings.apiKey) {
          try {
            const sys = `You are Aria, a warm, concise AI operating system assistant with a team of agents. Reply in 1-3 sentences.${
              ctx.name ? ` The user's name is ${ctx.name}.` : ""
            }`;
            reply = await callReal(
              {
                provider: os.settings.apiProvider,
                apiKey: os.settings.apiKey,
                model: os.settings.apiModel || undefined,
              },
              sys,
              trimmed,
              history,
            );
          } catch {
            reply = smallTalk(trimmed, ctx);
          }
        } else {
          reply = smallTalk(trimmed, ctx);
        }
        await typeStream(reply, patchAria);
        finishAria();
        set({ busy: false });
        if (spoken && os.settings.voiceEnabled) speak(reply);
      },

      runMission: async (prompt) => {
        const os = useOS.getState();
        const real = os.settings.useReal && !!os.settings.apiKey;
        const { title, subtasks } = planMission(prompt);
        const mission: Mission = {
          id: nanoid(8),
          title,
          prompt,
          status: "planning",
          createdAt: Date.now(),
          subtasks,
          result: "",
          engine: real ? "real" : "sim",
        };
        set((s) => ({
          missions: [mission, ...s.missions],
          activeMissionId: mission.id,
          agentStatus: idleStatus(),
        }));

        const mid = mission.id;
        const patchTask = (subId: string, patch: Partial<Subtask>) =>
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === mid
                ? {
                    ...m,
                    subtasks: m.subtasks.map((t) =>
                      t.id === subId ? { ...t, ...patch } : t,
                    ),
                  }
                : m,
            ),
          }));
        const setMission = (patch: Partial<Mission>) =>
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === mid ? { ...m, ...patch } : m,
            ),
          }));
        const post = (m: Omit<AgentMessage, "id" | "ts">) =>
          set((s) => ({
            bus: [
              ...s.bus,
              { ...m, id: nanoid(8), ts: Date.now() },
            ].slice(-200),
          }));
        const setStatus = (id: AgentId, st: "idle" | "working" | "done") =>
          set((s) => ({ agentStatus: { ...s.agentStatus, [id]: st } }));

        setMission({ status: "running" });

        const runTask = async (task: Subtask) => {
          const ag = AGENTS[task.agentId];
          setStatus(task.agentId, "working");
          patchTask(task.id, { status: "running", startedAt: Date.now() });
          post({ from: task.agentId, text: `Picking up: ${task.title}.` });
          await sleep(250 + Math.random() * 400);

          const cfg = {
            provider: os.settings.apiProvider,
            apiKey: os.settings.apiKey,
            model: os.settings.apiModel || undefined,
          };

          // Real tool use: Sage searches the live web before reasoning.
          let research = "";
          if (task.agentId === "sage") {
            post({ from: "sage", text: `🔎 web_search("${prompt.slice(0, 48)}")` });
            const { results, source } = await searchWeb(prompt);
            if (results.length) {
              research = formatResearch(prompt, results);
              post({
                from: "sage",
                text: `✓ ${results.length} live source${results.length > 1 ? "s" : ""} (${source})`,
              });
            } else {
              post({ from: "sage", text: "web_search came back empty — reasoning instead" });
            }
          }

          let full: string;
          if (task.agentId === "sage" && research) {
            // Ground Sage's output in the real fetched data.
            if (real) {
              try {
                full = await callReal(
                  cfg,
                  ag.system,
                  `Mission: ${prompt}\n\nYou ran a web_search and got these LIVE results:\n\n${research}\n\nDeliver your subtask "${task.title}": synthesize the key findings in tight bullets and cite the sources.`,
                );
              } catch {
                full = research;
              }
            } else {
              full = research;
            }
          } else if (real) {
            try {
              full = await callReal(
                cfg,
                ag.system,
                `Mission: ${prompt}\n\nYour subtask: ${task.title}\nRespond as ${ag.name} (${ag.role}).`,
              );
            } catch {
              full = simulateOutput(task.agentId, prompt);
            }
          } else {
            full = simulateOutput(task.agentId, prompt);
          }

          // Real tool use: Forge actually RUNS the JS it writes.
          if (task.agentId === "forge") {
            const m = full.match(/```(?:js|javascript)\n([\s\S]*?)```/);
            if (m) {
              post({ from: "forge", text: "▶ run_js(prototype)" });
              const res = await runJs(m[1]);
              full += res.ok
                ? `\n\n**▶ Live output** (${res.durationMs}ms):\n\`\`\`\n${res.output || "(no output)"}\n\`\`\``
                : `\n\n**▶ Execution failed:** ${res.error}`;
              post({
                from: "forge",
                text: res.ok ? `✓ ran in ${res.durationMs}ms` : "execution failed",
              });
            }
          }

          await typeStream(
            full,
            (txt) => patchTask(task.id, { output: txt }),
            6,
            12,
          );
          patchTask(task.id, { status: "done", finishedAt: Date.now() });
          setStatus(task.agentId, "done");
          set((s) => ({ tokens: s.tokens + Math.ceil(full.length / 4) }));
          post({ from: task.agentId, text: `Finished: ${task.title}.` });

          // save artifact files for the building agents
          const fileSpec = FILE_FOR[task.agentId];
          if (fileSpec) {
            set((s) => ({
              files: [
                {
                  id: nanoid(8),
                  name: fileSpec.name,
                  kind: fileSpec.kind,
                  content: full,
                  createdBy: task.agentId,
                  missionId: mid,
                  ts: Date.now(),
                },
                ...s.files,
              ],
            }));
          }
        };

        // 1. Atlas plans first.
        const atlas = subtasks.find((t) => t.agentId === "atlas")!;
        await runTask(atlas);

        // 2. Core specialists work in parallel.
        const core = subtasks.filter(
          (t) => t.agentId !== "atlas" && t.agentId !== "echo",
        );
        await Promise.all(core.map(runTask));

        // 3. Echo reviews last.
        const echo = subtasks.find((t) => t.agentId === "echo");
        if (echo) await runTask(echo);

        const result = synthesize(prompt);
        setMission({ status: "done", result });
        set({ activeMissionId: null });

        // save the synthesis + reset agent badges shortly after
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        set((s) => ({
          files: [
            {
              id: nanoid(8),
              name: `${slug || "mission"}.md`,
              kind: "md",
              content: `# ${title}\n\n${result}\n\n---\n\n${subtasks
                .map((t) => `## ${AGENTS[t.agentId].name} — ${t.title}\n\n${t.output}`)
                .join("\n\n")}`,
              createdBy: "atlas",
              missionId: mid,
              ts: Date.now(),
            },
            ...s.files,
          ],
        }));

        useOS.getState().notify({
          title: "Mission complete",
          body: title,
          icon: "Sparkles",
          color: "#7c6cff",
        });

        setTimeout(() => set({ agentStatus: idleStatus() }), 2500);
        return result;
      },
    }),
    {
      name: "aria-data",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        files: s.files,
        missions: s.missions,
        memory: s.memory,
      }),
    },
  ),
);
