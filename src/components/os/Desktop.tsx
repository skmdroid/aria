"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import Wallpaper from "./Wallpaper";
import Boot from "./Boot";
import DesktopWidgets from "./DesktopWidgets";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import WindowManager from "./WindowManager";
import Spotlight from "./Spotlight";
import ControlCenter from "./ControlCenter";
import Notifications from "./Notifications";
import VoiceOrb from "./VoiceOrb";

export default function Desktop() {
  const [mounted, setMounted] = useState(false);
  const booted = useOS((s) => s.booted);
  const accent = useOS((s) => s.settings.accent);
  const spotlightOpen = useOS((s) => s.spotlightOpen);
  const setSpotlight = useOS((s) => s.setSpotlight);
  const wins = useOS((s) => s.wins);

  useEffect(() => setMounted(true), []);

  // sync accent into the CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  // global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === " ")) {
        e.preventDefault();
        setSpotlight(!useOS.getState().spotlightOpen);
      } else if (e.key === "Escape") {
        const os = useOS.getState();
        if (os.spotlightOpen) os.setSpotlight(false);
        if (os.controlCenterOpen) os.setControlCenter(false);
        if (os.notifCenterOpen) os.setNotifCenter(false);
        if (os.ariaMenuOpen) os.setAriaMenu(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setSpotlight]);

  if (!mounted) return <div className="fixed inset-0 bg-bg0" />;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Wallpaper />
      <AnimatePresence>{!booted && <Boot key="boot" />}</AnimatePresence>
      {booted && (
        <>
          <DesktopWidgets />
          <MenuBar />
          <WindowManager />
          <Dock />
          <Spotlight />
          <ControlCenter />
          <Notifications />
          <VoiceOrb />
          {/* spotlight hint, bottom-left */}
          {wins.length === 0 && !spotlightOpen && (
            <div className="pointer-events-none fixed bottom-24 left-6 z-0">
              <div className="flex items-center gap-2 text-[12px] text-text2">
                Press{" "}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">⌘K</kbd>{" "}
                for Spotlight
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
