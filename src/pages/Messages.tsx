import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { profiles, Profile } from "@/data/profiles";
import { ArrowLeft, Calendar, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CONVO_IDS = ["1", "5", "8", "10"];
const tints = ["bg-pop-yellow", "bg-pop-pink", "bg-pop-green", "bg-pop-orange", "bg-primary-glow"];

interface Msg {
  id: number;
  fromMe: boolean;
  text: string;
  time: string;
}

const seedConvos: Record<string, Msg[]> = {
  "1": [
    { id: 1, fromMe: false, text: "Hey Alex! Loved your background at Airbnb. Want to chat about Lattice Pay?", time: "10:42" },
    { id: 2, fromMe: true, text: "Absolutely. Your wedge is sharp. Free this Thursday?", time: "10:51" },
    { id: 3, fromMe: false, text: "Thursday 2pm PT works. I'll send a calendar invite 🙌", time: "10:53" },
  ],
  "5": [
    { id: 1, fromMe: false, text: "Saw you're looking for a CTO. I've got eval pipelines for days.", time: "Yesterday" },
  ],
  "8": [
    { id: 1, fromMe: true, text: "Kenji, your portfolio is unreal. Are you open to chatting?", time: "Mon" },
    { id: 2, fromMe: false, text: "Yes! Send me a deck or a wireframe and I'm in.", time: "Mon" },
  ],
  "10": [
    { id: 1, fromMe: false, text: "Hardware is hard but the carbon math is real. Coffee in Berlin?", time: "Last week" },
  ],
};

const CHAT_EVENT = "netstart:chat-changed";
const chatKey = (id: string) => `netstart.chat.${id}`;

const loadChat = (id: string): Msg[] => {
  try {
    const raw = localStorage.getItem(chatKey(id));
    if (raw) return JSON.parse(raw) as Msg[];
  } catch {
    // ignore
  }
  return seedConvos[id] ?? [];
};

const saveChat = (id: string, msgs: Msg[]) => {
  localStorage.setItem(chatKey(id), JSON.stringify(msgs));
  window.dispatchEvent(new Event(CHAT_EVENT));
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Canned replies — picked based on context of the incoming message
const replyPool = [
  "Solid. Tell me more 👀",
  "Love that. What's the biggest open question for you right now?",
  "Ha, same energy. When are you free to jump on a quick call?",
  "Totally tracks. I've been thinking about this too.",
  "Ok you've got my attention. What does week one look like?",
  "Yes. I'm in. Send over anything you want me to read.",
  "Good point. I'd push back on one thing though...",
  "Let's do it. I can block out 30 min tomorrow.",
];

const pickReply = (text: string): string => {
  const t = text.toLowerCase();
  if (/\b(call|meet|chat|coffee|zoom|jump on)\b/.test(t))
    return "Down to hop on a call. Sending times now 📅";
  if (/\?/.test(t))
    return "Good question. Short answer yes, long answer let me think and circle back.";
  if (/\b(hi|hey|hello|yo|sup)\b/.test(t))
    return "Hey! 👋 What's on your mind?";
  if (/\b(thanks|thank you|ty)\b/.test(t))
    return "Anytime 🙌";
  return replyPool[Math.floor(Math.random() * replyPool.length)];
};

const Messages = () => {
  const convoProfiles = profiles.filter((p) => CONVO_IDS.includes(p.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const sync = () => forceTick((n) => n + 1);
    window.addEventListener(CHAT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHAT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const active = convoProfiles.find((p) => p.id === activeId) ?? null;

  if (active) {
    return <ChatView profile={active} onBack={() => setActiveId(null)} />;
  }

  return (
    <AppShell title="Messages">
      <div className="px-5 pt-2">
        <ul className="space-y-2">
          {convoProfiles.map((p) => {
            const msgs = loadChat(p.id);
            const last = msgs[msgs.length - 1];
            const tint = tints[parseInt(p.id) % tints.length];
            return (
              <li key={p.id}>
                <button
                  onClick={() => setActiveId(p.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-transparent p-2.5 text-left transition-all hover:border-foreground/20 hover:bg-card"
                >
                  <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-foreground ${tint}`}>
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      width={48}
                      height={48}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display font-black">{p.name}</p>
                      <span className="shrink-0 text-[11px] text-tertiary">{last?.time}</span>
                    </div>
                    <p className="line-clamp-1 text-xs text-secondary-soft">
                      {last ? (last.fromMe ? `You: ${last.text}` : last.text) : "Say hi 👋"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
};

const ChatView = ({ profile, onBack }: { profile: Profile; onBack: () => void }) => {
  const [msgs, setMsgs] = useState<Msg[]>(() => loadChat(profile.id));
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const tint = tints[parseInt(profile.id) % tints.length];
  const { toast } = useToast();
  const endRef = useRef<HTMLDivElement>(null);
  const replyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    saveChat(profile.id, msgs);
  }, [profile.id, msgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
    };
  }, []);

  const scheduleCall = () => {
    toast({
      title: `Call invite sent to ${profile.name.split(" ")[0]} 📞`,
      description: "You'll get a confirmation once they accept.",
    });
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const mine: Msg = { id: Date.now(), fromMe: true, text, time: formatTime(new Date()) };
    setMsgs((m) => [...m, mine]);
    setDraft("");

    // Trigger a reply — typing indicator then canned response
    if (replyTimeoutRef.current) window.clearTimeout(replyTimeoutRef.current);
    setTyping(true);
    replyTimeoutRef.current = window.setTimeout(() => {
      const reply: Msg = {
        id: Date.now() + 1,
        fromMe: false,
        text: pickReply(text),
        time: formatTime(new Date()),
      };
      setMsgs((m) => [...m, reply]);
      setTyping(false);
    }, 1200 + Math.random() * 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-foreground/10 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/20 bg-card hover:border-foreground/50"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className={`relative h-10 w-10 overflow-hidden rounded-full border-2 border-foreground ${tint}`}>
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-full w-full object-cover"
                width={40}
                height={40}
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-display text-base font-black">{profile.name}</p>
              <p className="truncate text-[11px] text-tertiary">
                {typing ? "typing..." : profile.headline}
              </p>
            </div>
            <button
              onClick={scheduleCall}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-foreground bg-primary px-3 text-xs font-black text-primary-foreground shadow-pop-white active:scale-95 transition"
              aria-label="Schedule a call"
            >
              <Calendar className="h-3.5 w-3.5" /> Call
            </button>
          </div>
          {/* Pinned context */}
          <div className="mx-4 mb-3 rounded-2xl border-2 border-foreground/15 bg-card p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-pop-yellow">
              {profile.role === "Founder" ? "✨ Building" : "🎯 Looking for"}
            </p>
            <p className="mt-1 text-xs text-secondary-soft">
              {profile.role === "Founder"
                ? `${profile.startup} · ${profile.pitch}`
                : `${profile.commitment} · ${profile.industries?.join(", ")} · ${profile.equityExpected}`}
            </p>
          </div>
        </header>

        <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] border-2 px-3.5 py-2 text-sm",
                  m.fromMe
                    ? "rounded-[20px] rounded-br-md border-foreground bg-primary text-primary-foreground shadow-pop-white"
                    : "rounded-[20px] rounded-bl-md border-foreground/15 bg-card text-foreground"
                )}
              >
                <p className="leading-relaxed">{m.text}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    m.fromMe ? "text-primary-foreground/70" : "text-tertiary"
                  )}
                >
                  {m.time}
                </p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-[20px] rounded-bl-md border-2 border-foreground/15 bg-card px-4 py-2.5">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-foreground/10 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Say something good..."
              className="flex-1 rounded-full border-2 border-foreground/20 bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-tertiary focus:border-primary focus:outline-none"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-foreground bg-primary text-primary-foreground shadow-pop-white disabled:opacity-40 active:scale-90 transition"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingDots = () => (
  <span className="inline-flex items-center gap-1" aria-label="typing">
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60" />
  </span>
);

export default Messages;
