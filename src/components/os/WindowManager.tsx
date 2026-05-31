"use client";

import { AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import Window from "./Window";

export default function WindowManager() {
  const wins = useOS((s) => s.wins);
  const visible = wins.filter((w) => !w.minimized);
  const topId = visible.reduce<string | null>(
    (top, w) =>
      top === null || w.z > (visible.find((x) => x.id === top)?.z ?? -1)
        ? w.id
        : top,
    null,
  );
  return (
    <AnimatePresence>
      {visible.map((w) => (
        <Window key={w.id} win={w} active={w.id === topId} />
      ))}
    </AnimatePresence>
  );
}
