"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { APPS, type AppId } from "@/lib/apps";
import Icon from "@/components/ui/Icon";

interface Result {
  id: string;
  label: string;
  sub: string;
  icon: string;
  color: string;
  run: () => void;
}

export default function Spotlight() {
  const open = useOS((s) => s.spotlightOpen);
  const setOpen = useOS((s) => s.setSpotlight);
  const openApp = useOS((s) => s.openApp);
  const setSettings = useOS((s) => s.setSettings);
  const settings = useOS((s) => s.settings);
  const sendChat = useAria((s) => s.sendChat);

  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const ql = q.trim().toLowerCase();
    const out: Result[] = [];

    if (ql.length > 2) {
      out.push({
        id: "ask",
        label: `Ask Aria: “${q.trim()}”`,
        sub: "Dispatch the agent team",
        icon: "Sparkles",
        color: "#7c6cff",
        run: () => {
          openApp("assistant");
          sendChat(q.trim());
        },
      });
    }

    const appHits = APPS.filter(
      (a) => !ql || a.name.toLowerCase().includes(ql) || a.id.includes(ql),
    ).map<Result>((a) => ({
      id: `app-${a.id}`,
      label: a.name,
      sub: "Open app",
      icon: a.icon,
      color: a.color,
      run: () => openApp(a.id as AppId),
    }));
    out.push(...appHits);

    const cmds: Result[] = [
      {
        id: "cmd-voicemode",
        label: "Voice Mode",
        sub: "Talk to Aria hands-free",
        icon: "AudioLines",
        color: "#7c6cff",
        run: () => useOS.getState().setVoiceMode(true),
      },
      {
        id: "cmd-voice",
        label: settings.voiceEnabled ? "Mute Aria's voice" : "Enable Aria's voice",
        sub: "System",
        icon: settings.voiceEnabled ? "VolumeX" : "Volume2",
        color: "#22d3ee",
        run: () => setSettings({ voiceEnabled: !settings.voiceEnabled }),
      },
      {
        id: "cmd-reboot",
        label: "Reboot Aria",
        sub: "System",
        icon: "RotateCcw",
        color: "#fb7185",
        run: () => useOS.getState().setBooted(false),
      },
    ].filter((c) => !ql || c.label.toLowerCase().includes(ql));
    out.push(...cmds);

    return out;
  }, [q, openApp, sendChat, setSettings, settings.voiceEnabled]);

  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results.length, active]);

  if (!open) return null;

  const choose = (r?: Result) => {
    const target = r ?? results[active];
    if (!target) return;
    target.run();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[160] flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.96, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.16 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-[min(620px,92vw)] overflow-hidden rounded-2xl glass-strong shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Icon name="Search" size={18} className="text-text2" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(results.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    choose();
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                placeholder="Search apps, run commands, or ask Aria anything…"
                className="flex-1 bg-transparent text-[15px] text-text0 outline-none placeholder:text-text3"
              />
              <kbd className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] text-text3">
                esc
              </kbd>
            </div>
            <div className="max-h-[44vh] overflow-y-auto p-2 scroll-thin">
              {results.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-text3">
                  No results
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                    i === active ? "bg-accent/20" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-lg"
                    style={{ background: `${r.color}22` }}
                  >
                    <Icon name={r.icon} size={16} color={r.color} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] text-text0">{r.label}</span>
                    <span className="block text-[11px] text-text3">{r.sub}</span>
                  </span>
                  {i === active && (
                    <kbd className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-text3">
                      ↵
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
