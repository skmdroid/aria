/** App registry metadata — kept free of React imports so stores can use it. */

export type AppId =
  | "assistant"
  | "agents"
  | "dashboard"
  | "terminal"
  | "files"
  | "notes"
  | "settings";

export interface AppMeta {
  id: AppId;
  name: string;
  /** lucide-react icon name */
  icon: string;
  color: string;
  /** default window size */
  w: number;
  h: number;
  minW: number;
  minH: number;
  /** show in the dock */
  dock: boolean;
}

export const APPS: AppMeta[] = [
  {
    id: "assistant",
    name: "Aria",
    icon: "Sparkles",
    color: "#7c6cff",
    w: 520,
    h: 680,
    minW: 380,
    minH: 460,
    dock: true,
  },
  {
    id: "agents",
    name: "Agents",
    icon: "Network",
    color: "#22d3ee",
    w: 980,
    h: 660,
    minW: 660,
    minH: 460,
    dock: true,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "LayoutDashboard",
    color: "#34d399",
    w: 900,
    h: 620,
    minW: 600,
    minH: 440,
    dock: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "SquareTerminal",
    color: "#f59e0b",
    w: 780,
    h: 500,
    minW: 460,
    minH: 300,
    dock: true,
  },
  {
    id: "files",
    name: "Files",
    icon: "FolderOpen",
    color: "#60a5fa",
    w: 840,
    h: 580,
    minW: 520,
    minH: 380,
    dock: true,
  },
  {
    id: "notes",
    name: "Notes",
    icon: "StickyNote",
    color: "#fbbf24",
    w: 660,
    h: 580,
    minW: 400,
    minH: 340,
    dock: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: "Settings",
    color: "#9aa3b8",
    w: 720,
    h: 640,
    minW: 480,
    minH: 420,
    dock: true,
  },
];

export const APP_MAP: Record<AppId, AppMeta> = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
) as Record<AppId, AppMeta>;

/**
 * Vibrant mesh-gradient wallpapers — saturated like macOS Sonoma/Sequoia but
 * tuned dark enough that glass windows stay readable on top.
 */
export const WALLPAPERS = [
  {
    id: "aurora",
    name: "Aurora",
    css: `radial-gradient(60% 85% at 12% 8%, #5b2a9d 0%, transparent 58%), radial-gradient(55% 75% at 88% 12%, #2058d6 0%, transparent 55%), radial-gradient(65% 65% at 78% 88%, #c0297a 0%, transparent 52%), radial-gradient(70% 70% at 8% 92%, #0e8aa8 0%, transparent 52%), linear-gradient(165deg, #0d0a1f, #07060f)`,
  },
  {
    id: "sunset",
    name: "Sunset",
    css: `radial-gradient(60% 80% at 18% 12%, #7c2d63 0%, transparent 55%), radial-gradient(60% 70% at 85% 20%, #d4572a 0%, transparent 52%), radial-gradient(70% 70% at 70% 92%, #8b2fbd 0%, transparent 55%), radial-gradient(60% 60% at 6% 88%, #b83a5a 0%, transparent 50%), linear-gradient(165deg, #160a14, #0a0610)`,
  },
  {
    id: "ocean",
    name: "Ocean",
    css: `radial-gradient(60% 80% at 15% 10%, #1e40af 0%, transparent 55%), radial-gradient(55% 70% at 85% 14%, #0e9ab0 0%, transparent 52%), radial-gradient(70% 70% at 75% 90%, #3b2a9d 0%, transparent 55%), radial-gradient(60% 60% at 8% 92%, #0d6e8c 0%, transparent 52%), linear-gradient(165deg, #07101f, #050a12)`,
  },
  {
    id: "nebula",
    name: "Nebula",
    css: `radial-gradient(55% 75% at 20% 14%, #6d28d9 0%, transparent 55%), radial-gradient(55% 70% at 82% 10%, #be2a6b 0%, transparent 52%), radial-gradient(70% 70% at 78% 86%, #2563eb 0%, transparent 55%), radial-gradient(60% 65% at 6% 90%, #7c2da8 0%, transparent 52%), linear-gradient(165deg, #0e0a1c, #06050d)`,
  },
  {
    id: "mint",
    name: "Mint",
    css: `radial-gradient(60% 80% at 16% 12%, #0f766e 0%, transparent 55%), radial-gradient(55% 70% at 86% 16%, #2563eb 0%, transparent 52%), radial-gradient(70% 70% at 74% 90%, #0d9488 0%, transparent 55%), radial-gradient(60% 60% at 8% 90%, #15803d 0%, transparent 50%), linear-gradient(165deg, #08130f, #050d0a)`,
  },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]["id"];
