"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useOS, type Win } from "@/store/useOS";
import { APP_MAP } from "@/lib/apps";
import Icon from "@/components/ui/Icon";
import { AppView } from "@/components/apps/registry";

const MENU_BAR_H = 30;

export default function Window({ win, active = true }: { win: Win; active?: boolean }) {
  const meta = APP_MAP[win.appId];
  const focusWin = useOS((s) => s.focusWin);
  const closeWin = useOS((s) => s.closeWin);
  const minimizeWin = useOS((s) => s.minimizeWin);
  const toggleMaximize = useOS((s) => s.toggleMaximize);
  const moveWin = useOS((s) => s.moveWin);
  const resizeWin = useOS((s) => s.resizeWin);

  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(
    null,
  );

  const onTitlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    focusWin(win.id);
    const cur = useOS.getState().wins.find((w) => w.id === win.id);
    if (!cur || cur.maximized) return;
    dragRef.current = { ox: e.clientX, oy: e.clientY, sx: cur.x, sy: cur.y };

    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nx = Math.min(
        vw - 80,
        Math.max(-(cur.w - 120), d.sx + ev.clientX - d.ox),
      );
      const ny = Math.min(vh - 48, Math.max(MENU_BAR_H, d.sy + ev.clientY - d.oy));
      moveWin(win.id, nx, ny);
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onResizePointerDown =
    (dir: "se" | "e" | "s") => (e: React.PointerEvent) => {
      e.stopPropagation();
      focusWin(win.id);
      const cur = useOS.getState().wins.find((w) => w.id === win.id);
      if (!cur) return;
      const start = { mx: e.clientX, my: e.clientY, w: cur.w, h: cur.h };
      const move = (ev: PointerEvent) => {
        const dw = ev.clientX - start.mx;
        const dh = ev.clientY - start.my;
        const nw =
          dir === "s" ? cur.w : Math.max(meta.minW, start.w + dw);
        const nh =
          dir === "e" ? cur.h : Math.max(meta.minH, start.h + dh);
        resizeWin(win.id, nw, nh);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

  return (
    <motion.div
      className="absolute flex flex-col overflow-hidden rounded-xl glass shadow-2xl"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        boxShadow: active
          ? "0 40px 90px -20px rgba(0,0,0,0.8), 0 0 0 1px var(--line-strong)"
          : "0 20px 50px -20px rgba(0,0,0,0.6), 0 0 0 1px var(--line)",
        opacity: active ? 1 : 0.94,
      }}
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      onPointerDown={() => focusWin(win.id)}
    >
      {/* title bar */}
      <div
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() =>
          toggleMaximize(win.id, {
            w: window.innerWidth,
            h: window.innerHeight,
          })
        }
        className="grab flex h-9 shrink-0 items-center gap-2 border-b border-line bg-white/[0.02] px-3"
      >
        <div className="group/lights flex items-center gap-2" data-no-drag>
          <button
            onClick={() => closeWin(win.id)}
            className="grid h-3 w-3 place-items-center rounded-full"
            style={{ background: active ? "#ff5f57" : "#4b5160" }}
            title="Close"
          >
            <Icon name="X" size={8} className="opacity-0 group-hover/lights:opacity-100" color="#5c0500" strokeWidth={3} />
          </button>
          <button
            onClick={() => minimizeWin(win.id)}
            className="grid h-3 w-3 place-items-center rounded-full"
            style={{ background: active ? "#febc2e" : "#4b5160" }}
            title="Minimize"
          >
            <Icon name="Minus" size={8} className="opacity-0 group-hover/lights:opacity-100" color="#5c3d00" strokeWidth={3} />
          </button>
          <button
            onClick={() =>
              toggleMaximize(win.id, {
                w: window.innerWidth,
                h: window.innerHeight,
              })
            }
            className="grid h-3 w-3 place-items-center rounded-full"
            style={{ background: active ? "#28c840" : "#4b5160" }}
            title="Zoom"
          >
            <Icon name="Maximize2" size={7} className="opacity-0 group-hover/lights:opacity-100" color="#0a3d12" strokeWidth={3} />
          </button>
        </div>
        <div
          className={`flex flex-1 items-center justify-center gap-1.5 text-[12px] font-medium ${
            active ? "text-text1" : "text-text3"
          }`}
        >
          <Icon name={meta.icon} size={12} color={active ? meta.color : "#5b6275"} />
          {meta.name}
        </div>
        <div className="w-14" />
      </div>

      {/* content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AppView appId={win.appId} winId={win.id} />
      </div>

      {/* resize handles */}
      {!win.maximized && (
        <>
          <div
            onPointerDown={onResizePointerDown("e")}
            className="absolute right-0 top-9 h-[calc(100%-2.5rem)] w-1.5 cursor-ew-resize"
          />
          <div
            onPointerDown={onResizePointerDown("s")}
            className="absolute bottom-0 left-0 h-1.5 w-full cursor-ns-resize"
          />
          <div
            onPointerDown={onResizePointerDown("se")}
            className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-nwse-resize"
          />
        </>
      )}
    </motion.div>
  );
}
