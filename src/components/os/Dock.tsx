"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { APPS, type AppId } from "@/lib/apps";
import { useOS } from "@/store/useOS";
import Icon from "@/components/ui/Icon";

const INFLUENCE = 120;
const MAX_SCALE = 0.8;
const BASE = 52;

export default function Dock() {
  const openApp = useOS((s) => s.openApp);
  const setSpotlight = useOS((s) => s.setSpotlight);
  const wins = useOS((s) => s.wins);
  const reduceMotion = useOS((s) => s.settings.reduceMotion);

  const [mouseX, setMouseX] = useState<number | null>(null);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const centers = useRef<Record<string, number>>({});
  const dockRef = useRef<HTMLDivElement>(null);

  const measure = () => {
    const items = dockRef.current?.querySelectorAll("[data-dock-item]");
    items?.forEach((el) => {
      const id = (el as HTMLElement).dataset.dockItem!;
      const r = el.getBoundingClientRect();
      centers.current[id] = r.left + r.width / 2;
    });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const scaleFor = (id: string) => {
    if (reduceMotion || mouseX == null) return 1;
    const c = centers.current[id];
    if (c == null) return 1;
    const dist = Math.abs(mouseX - c);
    if (dist > INFLUENCE) return 1;
    return 1 + MAX_SCALE * (1 - dist / INFLUENCE);
  };

  const launch = (appId: AppId) => {
    setBouncing(appId);
    setTimeout(() => setBouncing((b) => (b === appId ? null : b)), 720);
    openApp(appId);
  };

  const openIds = new Set(wins.map((w) => w.appId));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-2 z-[110] flex justify-center">
      <motion.div
        ref={dockRef}
        onMouseMove={(e) => {
          measure();
          setMouseX(e.clientX);
        }}
        onMouseLeave={() => setMouseX(null)}
        className="pointer-events-auto flex items-end gap-1.5 rounded-2xl glass-strong px-2.5 py-1.5 shadow-2xl"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 22 }}
      >
        {APPS.filter((a) => a.dock).map((app) => {
          const scale = scaleFor(app.id);
          const size = BASE * scale;
          return (
            <button
              key={app.id}
              data-dock-item={app.id}
              onClick={() => launch(app.id)}
              className="group relative flex flex-col items-center"
              title={app.name}
            >
              <motion.div
                className={`grid place-items-center rounded-xl border border-white/10 ${
                  bouncing === app.id ? "dock-bounce" : ""
                }`}
                style={{
                  width: size,
                  height: size,
                  background: `linear-gradient(150deg, ${app.color}30, ${app.color}10)`,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon name={app.icon} size={size * 0.5} color={app.color} strokeWidth={2} />
              </motion.div>
              <span
                className="mt-1 h-1 w-1 rounded-full transition-opacity"
                style={{
                  background: app.color,
                  opacity: openIds.has(app.id) ? 1 : 0,
                }}
              />
              {/* tooltip */}
              <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-bg2 px-2 py-1 text-[11px] text-text0 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {app.name}
              </span>
            </button>
          );
        })}

        <div className="mx-1 h-9 w-px self-center bg-line" />

        <button
          data-dock-item="spotlight"
          onClick={() => setSpotlight(true)}
          className="group relative flex flex-col items-center"
          title="Spotlight"
        >
          <motion.div
            className="grid place-items-center rounded-xl border border-white/10 bg-white/5"
            style={{
              width: BASE * scaleFor("spotlight"),
              height: BASE * scaleFor("spotlight"),
            }}
          >
            <Icon
              name="Search"
              size={BASE * scaleFor("spotlight") * 0.46}
              className="text-text1"
            />
          </motion.div>
          <span className="mt-1 h-1 w-1" />
        </button>
      </motion.div>
    </div>
  );
}
