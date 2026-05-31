"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { APP_MAP } from "@/lib/apps";
import Icon from "@/components/ui/Icon";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function MenuBar() {
  const now = useClock();
  const wins = useOS((s) => s.wins);
  const ariaMenuOpen = useOS((s) => s.ariaMenuOpen);
  const setAriaMenu = useOS((s) => s.setAriaMenu);
  const setSpotlight = useOS((s) => s.setSpotlight);
  const setControlCenter = useOS((s) => s.setControlCenter);
  const setNotifCenter = useOS((s) => s.setNotifCenter);
  const openApp = useOS((s) => s.openApp);
  const settings = useOS((s) => s.settings);
  const setSettings = useOS((s) => s.setSettings);
  const notifs = useOS((s) => s.notifs);

  const status = useAria((s) => s.agentStatus);
  const busy = useAria((s) => s.busy);
  const working = Object.values(status).filter((v) => v === "working").length;

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setAriaMenu(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [setAriaMenu]);

  const top = [...wins]
    .filter((w) => !w.minimized)
    .sort((a, b) => b.z - a.z)[0];
  const activeName = top ? APP_MAP[top.appId].name : "Finder";

  return (
    <div className="fixed inset-x-0 top-0 z-[120] flex h-[30px] items-center justify-between px-3 text-[13px] glass-strong border-b border-line">
      {/* left */}
      <div className="flex items-center gap-1" ref={menuRef}>
        <button
          onClick={() => setAriaMenu(!ariaMenuOpen)}
          className="grid h-[22px] w-[22px] place-items-center rounded-md accent-grad text-white hover:brightness-110"
          aria-label="Aria menu"
        >
          <span className="text-[13px] font-bold leading-none">A</span>
        </button>
        <span className="px-2 font-semibold">{activeName}</span>
        <span className="hidden px-2 text-text2 hover:text-text0 sm:inline cursor-default">
          File
        </span>
        <span className="hidden px-2 text-text2 hover:text-text0 sm:inline cursor-default">
          View
        </span>
        <span className="hidden px-2 text-text2 hover:text-text0 sm:inline cursor-default">
          Agents
        </span>

        <AnimatePresence>
          {ariaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute left-0 top-8 w-60 overflow-hidden rounded-xl glass-strong p-1.5 shadow-2xl"
            >
              <MenuItem
                label="About Aria"
                icon="Info"
                onClick={() => {
                  openApp("settings");
                  setAriaMenu(false);
                }}
              />
              <MenuItem
                label="Spotlight Search"
                icon="Search"
                shortcut="⌘K"
                onClick={() => {
                  setSpotlight(true);
                  setAriaMenu(false);
                }}
              />
              <MenuItem
                label="Voice Mode"
                icon="AudioLines"
                onClick={() => {
                  useOS.getState().setVoiceMode(true);
                  setAriaMenu(false);
                }}
              />
              <div className="my-1 h-px bg-line" />
              <MenuItem
                label={settings.voiceEnabled ? "Mute Aria's voice" : "Enable voice"}
                icon={settings.voiceEnabled ? "Volume2" : "VolumeX"}
                onClick={() => {
                  setSettings({ voiceEnabled: !settings.voiceEnabled });
                  setAriaMenu(false);
                }}
              />
              <MenuItem
                label="System Settings"
                icon="Settings"
                onClick={() => {
                  openApp("settings");
                  setAriaMenu(false);
                }}
              />
              <div className="my-1 h-px bg-line" />
              <MenuItem
                label="Reboot Aria"
                icon="RotateCcw"
                onClick={() => {
                  setAriaMenu(false);
                  useOS.getState().setBooted(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* right */}
      <div className="flex items-center gap-1.5 text-text1">
        {(working > 0 || busy) && (
          <div className="flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-[11px] text-text0">
            <Icon name="Loader" size={12} className="animate-spin-slow" />
            {working > 0 ? `${working} agent${working > 1 ? "s" : ""} working` : "thinking"}
          </div>
        )}
        <button
          onClick={() => useOS.getState().setVoiceMode(true)}
          className="rounded-md p-1 text-accent2 hover:bg-white/10"
          title="Voice mode"
        >
          <Icon name="AudioLines" size={15} />
        </button>
        <button
          onClick={() => openApp("assistant")}
          className="rounded-md p-1 hover:bg-white/10"
          title="Talk to Aria"
        >
          <Icon name="Sparkles" size={15} />
        </button>
        <button
          onClick={() =>
            setNotifCenter(!useOS.getState().notifCenterOpen)
          }
          className="relative rounded-md p-1 hover:bg-white/10"
          title="Notifications"
        >
          <Icon name="Bell" size={15} />
          {notifs.length > 0 && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-bad" />
          )}
        </button>
        <button
          onClick={() =>
            setControlCenter(!useOS.getState().controlCenterOpen)
          }
          className="rounded-md p-1 hover:bg-white/10"
          title="Control Center"
        >
          <Icon name="SlidersHorizontal" size={15} />
        </button>
        <span className="ml-1 tabular-nums text-text0">
          {now
            ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
            : ""}
        </span>
        <span className="tabular-nums font-medium text-text0">
          {now
            ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            : ""}
        </span>
      </div>
    </div>
  );
}

function MenuItem({
  label,
  icon,
  shortcut,
  onClick,
}: {
  label: string;
  icon: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-text1 hover:bg-accent hover:text-white"
    >
      <Icon name={icon} size={14} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[11px] opacity-60">{shortcut}</span>}
    </button>
  );
}
