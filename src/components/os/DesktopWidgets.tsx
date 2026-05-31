"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { AGENT_LIST } from "@/lib/agents";
import AgentAvatar from "@/components/ui/AgentAvatar";
import Icon from "@/components/ui/Icon";

export default function DesktopWidgets() {
  const openApp = useOS((s) => s.openApp);
  const missions = useAria((s) => s.missions);
  const files = useAria((s) => s.files);
  const status = useAria((s) => s.agentStatus);
  const working = Object.values(status).filter((v) => v === "working").length;

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pointer-events-none absolute right-5 top-12 z-0 flex w-[230px] flex-col gap-4">
      {/* clock */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => openApp("dashboard")}
        className="pointer-events-auto rounded-3xl glass p-5 text-left shadow-xl hover:bg-white/[0.06]"
      >
        <div className="text-[44px] font-semibold leading-none tracking-tight tabular-nums text-white">
          {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </div>
        <div className="mt-1.5 text-[13px] text-text2">
          {now
            ? now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : ""}
        </div>
      </motion.button>

      {/* aria status */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => openApp("assistant")}
        className="pointer-events-auto flex items-center gap-3 rounded-3xl glass p-4 text-left shadow-xl hover:bg-white/[0.06]"
      >
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl accent-grad">
          <Icon name="Sparkles" size={20} className="text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg1 bg-good" />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-white">Aria</div>
          <div className="text-[11px] text-text2">
            {working > 0 ? `${working} agents working…` : "online · ready"}
          </div>
        </div>
      </motion.button>

      {/* the team */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => openApp("agents")}
        className="pointer-events-auto rounded-3xl glass p-4 text-left shadow-xl hover:bg-white/[0.06]"
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-text1">The Team</span>
          <span className="text-[11px] text-text3">7 agents</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AGENT_LIST.map((a) => (
            <AgentAvatar key={a.id} id={a.id} size={36} status={status[a.id]} />
          ))}
        </div>
      </motion.button>

      {/* stat strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl glass p-3 text-center shadow-xl">
          <div className="text-[20px] font-semibold text-white">{missions.length}</div>
          <div className="text-[10px] text-text3">missions</div>
        </div>
        <div className="rounded-2xl glass p-3 text-center shadow-xl">
          <div className="text-[20px] font-semibold text-white">{files.length}</div>
          <div className="text-[10px] text-text3">artifacts</div>
        </div>
      </motion.div>
    </div>
  );
}
