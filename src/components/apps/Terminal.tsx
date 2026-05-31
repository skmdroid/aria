"use client";

import { useEffect, useRef, useState } from "react";
import { useAria } from "@/store/useAria";
import { useOS } from "@/store/useOS";
import { AGENT_LIST } from "@/lib/agents";
import { APPS, type AppId } from "@/lib/apps";
import { runJs, runPython } from "@/lib/runtime/exec";

interface Line {
  id: number;
  kind: "in" | "out" | "sys";
  text: string;
}

const BANNER = `   ▌▌ Aria OS — agent shell v1.0
   ▌▌ type 'help' for commands`;

let counter = 0;

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { id: counter++, kind: "sys", text: BANNER },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [, setHIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runMission = useAria((s) => s.runMission);
  const sendChat = useAria((s) => s.sendChat);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (text: string, kind: Line["kind"] = "out") =>
    setLines((l) => [...l, { id: counter++, kind, text }]);

  const exec = (raw: string) => {
    const cmd = raw.trim();
    print(`aria@os ~ % ${cmd}`, "in");
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHIdx(-1);

    const [name, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const aria = useAria.getState();
    const os = useOS.getState();

    switch (name.toLowerCase()) {
      case "help":
        print(
          [
            "Commands:",
            "  help              show this help",
            "  agents            list the agent roster",
            "  run <goal>        dispatch the team on a mission",
            "  ask <message>     chat with Aria",
            "  js <code>         run JavaScript for real",
            "  py <code>         run Python (CPython on WASM)",
            "  missions          list this session's missions",
            "  files | ls        list generated artifacts",
            "  cat <name>        print an artifact",
            "  open <app>        launch an app (assistant, agents, dashboard…)",
            "  voice on|off      toggle Aria's voice",
            "  clear             clear the screen",
            "  neofetch          system info",
          ].join("\n"),
        );
        break;
      case "agents":
        print(
          AGENT_LIST.map(
            (a) => `  ● ${a.name.padEnd(8)} ${a.role.padEnd(14)} ${a.blurb}`,
          ).join("\n"),
        );
        break;
      case "run":
      case "dispatch":
        if (!arg) return print("usage: run <goal>", "sys");
        print(`Dispatching team on: "${arg}"… open Agents to watch.`, "sys");
        os.openApp("agents");
        runMission(arg);
        break;
      case "ask":
        if (!arg) return print("usage: ask <message>", "sys");
        os.openApp("assistant");
        sendChat(arg);
        print("Sent to Aria — see the Assistant window.", "sys");
        break;
      case "js":
      case "node":
        if (!arg) return print("usage: js <code>   (e.g. js console.log(2**10))", "sys");
        print("running…", "sys");
        runJs(arg).then((r) =>
          print(
            r.ok ? r.output || "(no output)" : "Error: " + r.error,
            r.ok ? "out" : "sys",
          ),
        );
        break;
      case "py":
      case "python":
        if (!arg) return print("usage: py <code>   (e.g. py print(sum(range(100))))", "sys");
        print("booting Python… (first run downloads the WASM runtime)", "sys");
        runPython(arg).then((r) =>
          print(
            r.ok ? r.output || "(no output)" : "Error: " + r.error,
            r.ok ? "out" : "sys",
          ),
        );
        break;
      case "missions":
        if (!aria.missions.length) return print("no missions yet", "sys");
        print(
          aria.missions
            .map(
              (m) =>
                `  [${m.status === "done" ? "✓" : "•"}] ${m.title} (${m.subtasks.length} steps)`,
            )
            .join("\n"),
        );
        break;
      case "files":
      case "ls":
        if (!aria.files.length) return print("no artifacts yet", "sys");
        print(aria.files.map((f) => `  ${f.name.padEnd(20)} ${f.kind}`).join("\n"));
        break;
      case "cat": {
        const f = aria.files.find((x) => x.name === arg);
        if (!f) return print(`cat: ${arg}: no such file`, "sys");
        print(f.content);
        break;
      }
      case "open": {
        const app = APPS.find((a) => a.id === arg || a.name.toLowerCase() === arg.toLowerCase());
        if (!app) return print(`open: unknown app '${arg}'`, "sys");
        os.openApp(app.id as AppId);
        print(`opening ${app.name}…`, "sys");
        break;
      }
      case "voice":
        if (arg === "on" || arg === "off") {
          os.setSettings({ voiceEnabled: arg === "on" });
          print(`voice ${arg}`, "sys");
        } else print("usage: voice on|off", "sys");
        break;
      case "clear":
        setLines([]);
        break;
      case "whoami":
        print("you — the operator");
        break;
      case "date":
        print(new Date().toString());
        break;
      case "echo":
        print(arg);
        break;
      case "neofetch":
        print(
          [
            "       ◢◣        aria@os",
            "      ◢██◣       ---------",
            "     ◢████◣      OS: Aria 1.0 (web)",
            "    ◢██████◣     Kernel: agent-runtime",
            "   ◢████████◣    Agents: 7 online",
            `   ◥████████◤    Missions: ${aria.missions.length}`,
            "    ◥██████◤     Shell: aria-sh",
            "     ◥████◤      Theme: midnight",
          ].join("\n"),
        );
        break;
      default:
        print(`aria-sh: command not found: ${name} (try 'help')`, "sys");
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-black/70 font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3 text-[12.5px] leading-relaxed scroll-thin">
        {lines.map((l) => (
          <pre
            key={l.id}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "in"
                ? "text-accent2"
                : l.kind === "sys"
                  ? "text-text3"
                  : "text-text1"
            }`}
          >
            {l.text}
          </pre>
        ))}
        <div className="flex items-center gap-1.5 text-[12.5px]">
          <span className="text-good">aria@os</span>
          <span className="text-text3">~</span>
          <span className="text-accent">%</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                exec(input);
                setInput("");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHIdx((i) => {
                  const n = Math.min(history.length - 1, i + 1);
                  setInput(history[n] || "");
                  return n;
                });
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setHIdx((i) => {
                  const n = Math.max(-1, i - 1);
                  setInput(n === -1 ? "" : history[n] || "");
                  return n;
                });
              }
            }}
            className="flex-1 bg-transparent text-text0 caret-accent2 outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
