"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import { WALLPAPERS } from "@/lib/apps";
import Icon from "@/components/ui/Icon";

function Tile({
  active,
  onClick,
  icon,
  label,
  sub,
  color = "#7c6cff",
  wide,
}: {
  active?: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sub?: string;
  color?: string;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${
        wide ? "col-span-2" : ""
      } ${active ? "" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}
      style={active ? { background: color } : undefined}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-full"
        style={{ background: active ? "rgba(255,255,255,0.22)" : `${color}22` }}
      >
        <Icon name={icon} size={17} color={active ? "#fff" : color} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] font-medium ${active ? "text-white" : "text-text0"}`}>
          {label}
        </span>
        {sub && (
          <span className={`block truncate text-[11px] ${active ? "text-white/80" : "text-text3"}`}>
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}

export default function ControlCenter() {
  const open = useOS((s) => s.controlCenterOpen);
  const setOpen = useOS((s) => s.setControlCenter);
  const settings = useOS((s) => s.settings);
  const setSettings = useOS((s) => s.setSettings);
  const tokens = useAria((s) => s.tokens);
  const missions = useAria((s) => s.missions);

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[140]" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed right-2 top-9 z-[150] w-80 rounded-3xl glass-strong p-3 shadow-2xl"
          >
            <div className="grid grid-cols-2 gap-2">
              <Tile
                onClick={() => {
                  setOpen(false);
                  useOS.getState().setVoiceMode(true);
                }}
                icon="AudioLines"
                label="Voice Mode"
                sub="Hands-free"
                color="#7c6cff"
                wide
              />
              <Tile
                active={settings.voiceEnabled}
                onClick={() => setSettings({ voiceEnabled: !settings.voiceEnabled })}
                icon={settings.voiceEnabled ? "Volume2" : "VolumeX"}
                label="Aria Voice"
                sub={settings.voiceEnabled ? "On" : "Muted"}
                color="#22d3ee"
              />
              <Tile
                active={settings.useReal && !!settings.apiKey}
                onClick={() => setSettings({ useReal: !settings.useReal })}
                icon="Cpu"
                label="Real LLM"
                sub={settings.apiKey ? (settings.useReal ? "Live" : "Off") : "No key"}
                color="#34d399"
              />
              <Tile
                active={settings.reduceMotion}
                onClick={() => setSettings({ reduceMotion: !settings.reduceMotion })}
                icon="Wind"
                label="Reduce Motion"
                sub={settings.reduceMotion ? "On" : "Off"}
                color="#f59e0b"
              />
              <Tile
                onClick={() => useOS.getState().setBooted(false)}
                icon="RotateCcw"
                label="Reboot"
                sub="Restart Aria"
                color="#fb7185"
              />
            </div>

            <div className="mt-3 rounded-2xl bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-text3">
                <span>WALLPAPER</span>
              </div>
              <div className="flex gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSettings({ wallpaper: w.id })}
                    className={`h-9 flex-1 rounded-lg border-2 ${
                      settings.wallpaper === w.id
                        ? "border-white"
                        : "border-transparent"
                    }`}
                    style={{ background: w.css }}
                    title={w.name}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2.5 text-[12px]">
              <span className="text-text3">Session</span>
              <span className="text-text1">
                {missions.length} missions · {tokens.toLocaleString()} tokens
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
