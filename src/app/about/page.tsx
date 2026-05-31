/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { AGENT_LIST } from "@/lib/agents";
import Icon from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Aria — the AI operating system in your browser",
  description:
    "An open-source web desktop with a live multi-agent brain. Real tools, a local LLM via WebGPU, live code execution, and a mission-control graph.",
};

const FEATURES = [
  {
    icon: "Network",
    color: "#7c6cff",
    title: "A real multi-agent team",
    body: "Seven specialists — orchestrated live. Atlas plans, the team builds in parallel, Echo reviews. Watch every handoff stream in real time.",
  },
  {
    icon: "Cpu",
    color: "#a78bfa",
    title: "A brain that runs in your browser",
    body: "Download a small Llama or Qwen and run it fully on your machine via WebGPU — no server, no key, completely private. Or bring your own API key.",
  },
  {
    icon: "SquareTerminal",
    color: "#f59e0b",
    title: "Live code execution",
    body: "Real Python (CPython on WASM) and sandboxed JavaScript run in-browser. Agents don't just write code — they run it.",
  },
  {
    icon: "Telescope",
    color: "#22d3ee",
    title: "Real tools, real effects",
    body: "Live web search with cited sources, real downloadable artifacts, and keyless image generation. Not scripted text — actual work.",
  },
  {
    icon: "Workflow",
    color: "#34d399",
    title: "Mission-control graph",
    body: "A live force graph of agents reasoning, calling tools, and handing off — with one-click mission replay.",
  },
  {
    icon: "AudioLines",
    color: "#f472b6",
    title: "Talk to it",
    body: "A hands-free voice mode that listens, transcribes, and speaks back. Plus a full window manager, dock, and Spotlight.",
  },
];

const SHOTS = [
  { src: "/screenshots/15-graph-running.png", cap: "Live agent graph" },
  { src: "/screenshots/13-code-python.png", cap: "Python in the browser" },
  { src: "/screenshots/11-live-research.png", cap: "Live web research" },
];

export default function About() {
  return (
    <div className="h-screen overflow-y-auto bg-bg0 text-text0 scroll-thin">
      {/* nav */}
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-line px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl accent-grad text-[15px] font-bold text-white">
            A
          </span>
          <span className="text-[15px] font-semibold">Aria</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/skmdroid/aria"
            className="hidden rounded-lg px-3 py-1.5 text-[13px] text-text1 hover:bg-white/5 sm:block"
          >
            GitHub
          </a>
          <Link
            href="/"
            className="rounded-lg accent-grad px-3.5 py-1.5 text-[13px] font-medium text-white"
          >
            Launch Aria →
          </Link>
        </div>
      </nav>

      {/* hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center">
        <div
          className="absolute left-1/2 top-0 -z-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: "#7c6cff22" }}
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[22px] accent-grad text-4xl font-bold text-white shadow-2xl">
            A
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            The AI operating system <span className="accent-text">in your browser</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-text2 sm:text-lg">
            An open-source web desktop with a live multi-agent brain. Hand it a goal and watch a
            team of agents plan, research, code, and design it — using real tools, in real time.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl accent-grad px-5 py-2.5 text-[14px] font-medium text-white shadow-lg"
            >
              Launch Aria →
            </Link>
            <a
              href="https://github.com/skmdroid/aria"
              className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-[14px] text-text1 hover:bg-white/5"
            >
              <Icon name="Github" size={16} /> View source
            </a>
          </div>
          <p className="mt-4 text-[12px] text-text3">
            Free · open source · works instantly, no API key required
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <img
            src="/screenshots/00-desktop-clean.png"
            alt="Aria desktop"
            className="w-full rounded-2xl border border-line shadow-2xl"
          />
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-2 text-center text-2xl font-semibold sm:text-3xl">
          Not a chat box. An operating system.
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-[14px] text-text2">
          Every capability is real — it works the moment you open it, and gets sharper when you plug
          in a model.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-line bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
            >
              <span
                className="mb-3 grid h-11 w-11 place-items-center rounded-xl"
                style={{ background: `${f.color}22` }}
              >
                <Icon name={f.icon} size={20} color={f.color} />
              </span>
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* the team */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold">Meet the team</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {AGENT_LIST.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white/[0.02] p-4 text-center"
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{ background: `${a.color}22`, border: `1px solid ${a.color}55` }}
              >
                <Icon name={a.icon} size={22} color={a.color} />
              </span>
              <div>
                <div className="text-[13px] font-semibold">{a.name}</div>
                <div className="text-[11px] text-text3">{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* screenshots */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {SHOTS.map((s) => (
            <figure key={s.src} className="overflow-hidden rounded-2xl border border-line">
              <img src={s.src} alt={s.cap} className="w-full" />
              <figcaption className="border-t border-line px-4 py-2.5 text-[12px] text-text2">
                {s.cap}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold">See it for yourself</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] text-text2">
          It boots in seconds and works with zero setup. Give it a mission and watch the team go.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl accent-grad px-6 py-3 text-[15px] font-medium text-white shadow-lg"
          >
            Launch Aria →
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-[12px] text-text3">
        Built with Next.js, React & Tailwind · Open source (MIT) ·{" "}
        <a href="https://github.com/skmdroid/aria" className="text-text2 hover:text-text0">
          github.com/skmdroid/aria
        </a>
      </footer>
    </div>
  );
}
