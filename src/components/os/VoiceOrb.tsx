"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import { useAria } from "@/store/useAria";
import {
  listen,
  type Listener,
  recognitionSupported,
  speak,
  speechSupported,
  stopSpeaking,
} from "@/lib/voice";
import Icon from "@/components/ui/Icon";

type Mode = "idle" | "listening" | "thinking" | "speaking";

export default function VoiceOrb() {
  const open = useOS((s) => s.voiceMode);
  const setOpen = useOS((s) => s.setVoiceMode);
  const chat = useAria((s) => s.chat);

  const [mode, setMode] = useState<Mode>("idle");
  const [transcript, setTranscript] = useState("");
  const [caption, setCaption] = useState("");

  const listenerRef = useRef<Listener | null>(null);
  const activeRef = useRef(false);
  const modeRef = useRef<Mode>("idle");
  const baselineRef = useRef(0);
  modeRef.current = mode;

  const supported = recognitionSupported();

  const startListening = () => {
    if (!activeRef.current || !supported) return;
    stopSpeaking();
    setTranscript("");
    setMode("listening");
    listenerRef.current = listen({
      onResult: (text, final) => {
        setTranscript(text);
        if (final) handleFinal(text);
      },
      onEnd: () => {
        // if it ended without a final result while still listening, retry
        if (activeRef.current && modeRef.current === "listening") {
          setTimeout(() => startListening(), 300);
        }
      },
      onError: () => {
        if (activeRef.current) setMode("idle");
      },
    });
    if (!listenerRef.current) setMode("idle");
  };

  const handleFinal = (text: string) => {
    listenerRef.current?.stop();
    if (!text.trim()) {
      if (activeRef.current) startListening();
      return;
    }
    setMode("thinking");
    // count aria messages now; speak the next finished one
    baselineRef.current = useAria.getState().chat.filter((m) => m.role === "aria").length;
    useAria.getState().sendChat(text, false); // we handle speech ourselves
  };

  // watch for Aria's reply, then speak it
  useEffect(() => {
    if (modeRef.current !== "thinking") return;
    const ariaMsgs = chat.filter((m) => m.role === "aria");
    const reply = ariaMsgs[ariaMsgs.length - 1];
    if (
      ariaMsgs.length > baselineRef.current &&
      reply &&
      !reply.streaming &&
      reply.text
    ) {
      setCaption(reply.text);
      setMode("speaking");
      speak(reply.text, {
        onEnd: () => {
          if (activeRef.current) startListening();
          else setMode("idle");
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat]);

  // open / close lifecycle
  useEffect(() => {
    if (open) {
      activeRef.current = true;
      setCaption("");
      const t = setTimeout(() => startListening(), 500);
      return () => clearTimeout(t);
    } else {
      activeRef.current = false;
      listenerRef.current?.stop();
      stopSpeaking();
      setMode("idle");
      setTranscript("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useOS.getState().voiceMode) setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setOpen]);

  const label: Record<Mode, string> = {
    idle: supported ? "Tap the orb to talk" : "Voice input isn't supported here",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  const orbColor =
    mode === "listening" ? "#22d3ee" : mode === "speaking" ? "#34d399" : "#7c6cff";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[170] flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />

          <button
            onClick={() => setOpen(false)}
            className="absolute right-6 top-6 z-10 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-text1 hover:bg-white/20"
          >
            <Icon name="X" size={14} /> Close · Esc
          </button>

          <div className="relative flex flex-col items-center gap-10">
            {/* the orb */}
            <button
              onClick={() => {
                if (mode === "listening") {
                  listenerRef.current?.stop();
                  setMode("idle");
                } else if (mode === "idle") {
                  startListening();
                }
              }}
              className="relative grid h-64 w-64 place-items-center"
            >
              {/* outer rotating rings */}
              <span
                className="absolute inset-0 rounded-full border opacity-30"
                style={{
                  borderColor: orbColor,
                  animation: "ariaSpin 8s linear infinite",
                }}
              />
              <span
                className="absolute inset-6 rounded-full border opacity-40"
                style={{
                  borderColor: orbColor,
                  animation: "ariaSpin 5s linear infinite reverse",
                }}
              />
              {/* glow */}
              <span
                className="absolute inset-10 rounded-full blur-2xl"
                style={{ background: `${orbColor}55` }}
              />
              {/* pulsing aura while active */}
              {(mode === "listening" || mode === "speaking") && (
                <>
                  <span
                    className="absolute inset-10 rounded-full"
                    style={{
                      background: `${orbColor}33`,
                      animation: "ariaPulse 1.6s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="absolute inset-4 rounded-full"
                    style={{
                      border: `1px solid ${orbColor}55`,
                      animation: "ariaPulse 2.1s ease-in-out infinite",
                    }}
                  />
                </>
              )}
              {/* core */}
              <span
                className="relative grid h-32 w-32 place-items-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${orbColor}, #1a1430 80%)`,
                  boxShadow: `0 0 60px ${orbColor}66, inset 0 0 30px rgba(255,255,255,0.1)`,
                }}
              >
                {mode === "speaking" ? (
                  <span className="flex items-end gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-white"
                        style={{
                          height: 10 + (i % 2 ? 18 : 28),
                          animation: "ariaBars 0.7s ease-in-out infinite",
                          animationDelay: `${i * 0.1}s`,
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </span>
                ) : mode === "thinking" ? (
                  <Icon name="Loader" size={34} className="animate-spin-slow text-white" />
                ) : (
                  <Icon
                    name={mode === "listening" ? "Mic" : "Sparkles"}
                    size={36}
                    className="text-white"
                  />
                )}
              </span>
            </button>

            <div className="flex min-h-[6rem] max-w-xl flex-col items-center gap-3 px-6 text-center">
              <div className="text-[13px] font-medium uppercase tracking-wider" style={{ color: orbColor }}>
                {label[mode]}
              </div>
              {transcript && (
                <div className="text-[18px] text-white">“{transcript}”</div>
              )}
              {caption && mode === "speaking" && (
                <div className="text-[14px] leading-relaxed text-text2">
                  {caption.replace(/[*_`#>]/g, "").slice(0, 220)}
                </div>
              )}
              {!transcript && mode === "idle" && (
                <div className="text-[13px] text-text3">
                  Say “research the best laptops” or “what’s my name?”
                  {!speechSupported() && " (your browser can’t speak back)"}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
