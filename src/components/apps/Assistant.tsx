"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAria } from "@/store/useAria";
import { useOS } from "@/store/useOS";
import Icon from "@/components/ui/Icon";
import Markdown from "@/components/ui/Markdown";
import {
  listen,
  type Listener,
  recognitionSupported,
  stopSpeaking,
} from "@/lib/voice";

const SUGGESTIONS = [
  "Research the best note-taking apps in 2025",
  "Build me a pricing page for a SaaS",
  "Write a launch tweet for an AI tool",
  "Design a dark-mode dashboard",
];

export default function Assistant() {
  const chat = useAria((s) => s.chat);
  const busy = useAria((s) => s.busy);
  const sendChat = useAria((s) => s.sendChat);
  const clearChat = useAria((s) => s.clearChat);
  const voiceEnabled = useOS((s) => s.settings.voiceEnabled);
  const setVoiceMode = useOS((s) => s.setVoiceMode);
  const useReal = useOS((s) => s.settings.useReal && !!s.settings.apiKey);
  const provider = useOS((s) => s.settings.apiProvider);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const listenerRef = useRef<Listener | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  const send = (text: string, spoken = false) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    sendChat(t, spoken);
  };

  const toggleMic = () => {
    if (listening) {
      listenerRef.current?.stop();
      setListening(false);
      return;
    }
    stopSpeaking();
    setListening(true);
    listenerRef.current = listen({
      onResult: (text, final) => {
        setInput(text);
        if (final) {
          setListening(false);
          send(text, true);
        }
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!listenerRef.current) setListening(false);
  };

  const onlyWelcome = chat.length <= 1;

  return (
    <div className="flex h-full flex-col bg-bg1/40">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl accent-grad">
          <Icon name="Sparkles" size={18} className="text-white" />
          {busy && (
            <span className="absolute inset-0 rounded-xl border-2 border-white/40 animate-pulse-soft" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold">Aria</div>
          <div className="flex items-center gap-1.5 text-[11px] text-text3">
            {busy ? (
              <>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2.5 w-0.5 origin-bottom rounded-full bg-accent2"
                      style={{
                        animation: "ariaBars 0.9s ease-in-out infinite",
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </span>
                thinking…
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-good" /> online
              </>
            )}
          </div>
        </div>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
          style={{
            background: useReal ? "#22d3ee22" : "#34d39922",
            color: useReal ? "#22d3ee" : "#34d399",
          }}
          title={
            useReal
              ? `Live — your messages go to ${provider} with your key`
              : "On-device — nothing leaves your browser"
          }
        >
          <Icon name={useReal ? "Globe" : "ShieldCheck"} size={11} />
          {useReal ? "Live" : "On-device"}
        </span>
        {recognitionSupported() && (
          <button
            onClick={() => setVoiceMode(true)}
            className="rounded-lg p-1.5 text-accent2 hover:bg-white/10"
            title="Voice mode"
          >
            <Icon name="AudioLines" size={16} />
          </button>
        )}
        <button
          onClick={() => {
            stopSpeaking();
            clearChat();
          }}
          className="rounded-lg p-1.5 text-text3 hover:bg-white/10 hover:text-text0"
          title="New chat"
        >
          <Icon name="SquarePen" size={16} />
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
        {chat.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {m.role === "aria" && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg accent-grad">
                <Icon name="Sparkles" size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-white/[0.05] text-text0"
              }`}
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.text}</p>
              ) : (
                <>
                  <Markdown text={m.text || "…"} />
                  {m.streaming && <span className="caret" />}
                </>
              )}
            </div>
          </motion.div>
        ))}

        {onlyWelcome && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-xl border border-line bg-white/[0.03] p-2.5 text-left text-[12px] text-text1 hover:border-accent/50 hover:bg-accent/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* input */}
      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-2xl bg-white/[0.05] p-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={listening ? "Listening…" : "Message Aria, or give the team a mission…"}
            className="max-h-28 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13px] text-text0 outline-none placeholder:text-text3 scroll-thin"
          />
          {recognitionSupported() && (
            <button
              onClick={toggleMic}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                listening
                  ? "bg-bad text-white animate-pulse-soft"
                  : "bg-white/[0.06] text-text1 hover:bg-white/10"
              }`}
              title={voiceEnabled ? "Talk to Aria" : "Voice (mute is on for replies)"}
            >
              <Icon name={listening ? "MicOff" : "Mic"} size={16} />
            </button>
          )}
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || busy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl accent-grad text-white disabled:opacity-40"
            title="Send"
          >
            <Icon name="ArrowUp" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
