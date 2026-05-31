"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { APP_MAP, type AppId, type WallpaperId } from "@/lib/apps";

export interface Win {
  id: string;
  appId: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; w: number; h: number };
  launchAt: number;
}

export interface Notif {
  id: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  ts: number;
}

export interface Settings {
  accent: string;
  wallpaper: WallpaperId;
  voiceEnabled: boolean;
  reduceMotion: boolean;
  useReal: boolean;
  apiProvider: "openai" | "anthropic";
  apiKey: string;
  apiModel: string;
}

interface OSState {
  booted: boolean;
  wins: Win[];
  topZ: number;
  spotlightOpen: boolean;
  controlCenterOpen: boolean;
  ariaMenuOpen: boolean;
  notifCenterOpen: boolean;
  voiceMode: boolean;
  notifs: Notif[];
  settings: Settings;

  setBooted: (b: boolean) => void;
  openApp: (appId: AppId) => void;
  closeWin: (id: string) => void;
  focusWin: (id: string) => void;
  minimizeWin: (id: string) => void;
  toggleMaximize: (id: string, viewport: { w: number; h: number }) => void;
  moveWin: (id: string, x: number, y: number) => void;
  resizeWin: (id: string, w: number, h: number, x?: number, y?: number) => void;
  isOpen: (appId: AppId) => boolean;

  setSpotlight: (b: boolean) => void;
  setControlCenter: (b: boolean) => void;
  setAriaMenu: (b: boolean) => void;
  setNotifCenter: (b: boolean) => void;
  setVoiceMode: (b: boolean) => void;

  notify: (n: Omit<Notif, "id" | "ts">) => void;
  dismissNotif: (id: string) => void;
  clearNotifs: () => void;

  setSettings: (p: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  accent: "#7c6cff",
  wallpaper: "aurora",
  voiceEnabled: true,
  reduceMotion: false,
  useReal: false,
  apiProvider: "openai",
  apiKey: "",
  apiModel: "",
};

const MENU_BAR_H = 30;

function nextPosition(count: number, w: number, h: number) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const baseX = Math.max(40, (vw - w) / 2 - 80);
  const baseY = Math.max(MENU_BAR_H + 16, (vh - h) / 2 - 60);
  const off = (count % 6) * 28;
  return { x: baseX + off, y: baseY + off };
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      booted: false,
      wins: [],
      topZ: 10,
      spotlightOpen: false,
      controlCenterOpen: false,
      ariaMenuOpen: false,
      notifCenterOpen: false,
      voiceMode: false,
      notifs: [],
      settings: DEFAULT_SETTINGS,

      setBooted: (b) => set({ booted: b }),

      openApp: (appId) => {
        const existing = get().wins.find((w) => w.appId === appId);
        const z = get().topZ + 1;
        if (existing) {
          set((s) => ({
            topZ: z,
            wins: s.wins.map((w) =>
              w.id === existing.id ? { ...w, minimized: false, z } : w,
            ),
          }));
          return;
        }
        const meta = APP_MAP[appId];
        const { x, y } = nextPosition(get().wins.length, meta.w, meta.h);
        const win: Win = {
          id: nanoid(8),
          appId,
          x,
          y,
          w: meta.w,
          h: meta.h,
          z,
          minimized: false,
          maximized: false,
          launchAt: Date.now(),
        };
        set((s) => ({ wins: [...s.wins, win], topZ: z }));
      },

      closeWin: (id) =>
        set((s) => ({ wins: s.wins.filter((w) => w.id !== id) })),

      focusWin: (id) => {
        const z = get().topZ + 1;
        set((s) => ({
          topZ: z,
          wins: s.wins.map((w) =>
            w.id === id ? { ...w, z, minimized: false } : w,
          ),
        }));
      },

      minimizeWin: (id) =>
        set((s) => ({
          wins: s.wins.map((w) =>
            w.id === id ? { ...w, minimized: true } : w,
          ),
        })),

      toggleMaximize: (id, viewport) =>
        set((s) => ({
          wins: s.wins.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized && w.prev) {
              return { ...w, maximized: false, ...w.prev, prev: undefined };
            }
            return {
              ...w,
              maximized: true,
              prev: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: MENU_BAR_H,
              w: viewport.w,
              h: viewport.h - MENU_BAR_H - 84,
            };
          }),
        })),

      moveWin: (id, x, y) =>
        set((s) => ({
          wins: s.wins.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),

      resizeWin: (id, w, h, x, y) =>
        set((s) => ({
          wins: s.wins.map((win) =>
            win.id === id
              ? {
                  ...win,
                  w,
                  h,
                  x: x ?? win.x,
                  y: y ?? win.y,
                }
              : win,
          ),
        })),

      isOpen: (appId) =>
        get().wins.some((w) => w.appId === appId && !w.minimized),

      setSpotlight: (b) => set({ spotlightOpen: b }),
      setControlCenter: (b) =>
        set({ controlCenterOpen: b, notifCenterOpen: false }),
      setAriaMenu: (b) => set({ ariaMenuOpen: b }),
      setNotifCenter: (b) =>
        set({ notifCenterOpen: b, controlCenterOpen: false }),
      setVoiceMode: (b) => set({ voiceMode: b }),

      notify: (n) =>
        set((s) => ({
          notifs: [{ ...n, id: nanoid(8), ts: Date.now() }, ...s.notifs].slice(
            0,
            30,
          ),
        })),
      dismissNotif: (id) =>
        set((s) => ({ notifs: s.notifs.filter((n) => n.id !== id) })),
      clearNotifs: () => set({ notifs: [] }),

      setSettings: (p) =>
        set((s) => ({ settings: { ...s.settings, ...p } })),
    }),
    {
      name: "aria-os",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ settings: s.settings }),
    },
  ),
);
