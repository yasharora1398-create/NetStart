"use client";
/**
 * Interactive laptop demo - the last section of the home page.
 *
 * A CSS laptop mockup whose screen runs a faithful, simplified
 * replica of the /app surface. A guided tour walks the visitor
 * through the whole product loop:
 *
 *   profile setup → human review → swiping Match → saving →
 *   picking from Saved → chatting
 *
 * Tour mechanics:
 *   - A green rectangle outlines the current target. Everything
 *     outside the rectangle is dimmed and slightly blurred (four
 *     overlay panels with backdrop-filter), except the speech
 *     bubble, which renders above the overlay.
 *   - "Read" steps show a Next button in the green speech bubble.
 *   - "Do" steps wait for the visitor to click the highlighted
 *     area; the click runs the scripted app action (add a skill,
 *     swipe the card, send the message) and advances the tour.
 *
 * Proportions: the app renders at a fixed internal 1280×800 stage
 * (16:10 - real laptop aspect) and is scaled with transform to fit
 * its container. Fullscreen reuses the exact same stage at a bigger
 * scale, so normal and fullscreen are pixel-proportional.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "@/lib/router-compat";
import {
  BadgeCheck,
  Bookmark,
  Check,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  RotateCcw,
  Send,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_W = 1280;
const STAGE_H = 800;
const RECT_PAD = 10;
const BUBBLE_W = 312;

type Screen = "profile" | "review" | "match" | "chat";

type Step = {
  /** data-demo key of the highlight target; null = dim everything,
   *  center the bubble (intro / outro). */
  target: string | null;
  title: string;
  text: string;
  advance: "next" | "click";
  /** Scripted app mutation to run when this step advances. */
  action?:
    | "addSkill"
    | "submit"
    | "toMatch"
    | "saveTop"
    | "passTop"
    | "openSaved"
    | "openChat"
    | "sendMessage";
  nextLabel?: string;
  final?: boolean;
};

const STEPS: Step[] = [
  {
    target: null,
    title: "Welcome to the Polln8 demo",
    text: "This is the real flow, end to end: profile, human review, match, save, chat. Nothing here is a video. You'll click through it yourself.",
    advance: "next",
    nextLabel: "Start the tour",
  },
  {
    target: "profile-form",
    title: "Your profile",
    text: "Everything starts here: who you are, what you've shipped, and what you want to join. Founders read this before they ever talk to you.",
    advance: "next",
  },
  {
    target: "skill-frontend",
    title: "Add a skill",
    text: "Skills decide how your deck gets ranked. Try it: click Frontend to add it to your profile.",
    advance: "click",
    action: "addSkill",
  },
  {
    target: "submit",
    title: "Submit for review",
    text: "Now click Submit for review. Every profile goes to a human reviewer, not an algorithm.",
    advance: "click",
    action: "submit",
  },
  {
    target: "review-card",
    title: "A human checks your work",
    text: "A reviewer cross-checks your LinkedIn, résumé, and public work. Most profiles clear in under 24 hours. You're in.",
    advance: "next",
    action: "toMatch",
  },
  {
    target: "deck-card",
    title: "This is Match",
    text: "One person at a time, ranked against your skills. No feeds, no spam. Maya is a founder building creator tools, and she needs exactly what you do.",
    advance: "next",
  },
  {
    target: "save-btn",
    title: "Save the good ones",
    text: "Click Save to add Maya to your shortlist.",
    advance: "click",
    action: "saveTop",
  },
  {
    target: "pass-btn",
    title: "Pass works too",
    text: "Leo's project isn't your fit. Click Pass. He won't show up again.",
    advance: "click",
    action: "passTop",
  },
  {
    target: "left-saved-tab",
    title: "Your shortlist",
    text: "Everyone you save lands in one place. Click Saved to open your shortlist.",
    advance: "click",
    action: "openSaved",
  },
  {
    target: "saved-maya",
    title: "Commit when you're ready",
    text: "Compare your saves on your own time, then start the conversation. Click Maya.",
    advance: "click",
    action: "openChat",
  },
  {
    target: "send-btn",
    title: "Mutual chat only",
    text: "Chat opens only when both sides opt in. No cold DMs, ever. Your first message is drafted. Click Send.",
    advance: "click",
    action: "sendMessage",
  },
  {
    target: "chat-thread",
    title: "And you're in business",
    text: "Your pitch lands, Maya replies, and from here it's just two people building. Polln8 stays out of the way.",
    advance: "next",
  },
  {
    target: null,
    title: "That's the whole loop",
    text: "Profile, human review, ranked matches, mutual chat. The real thing takes about five minutes to set up, and the deck is already full of people who cleared the same bar you just saw.",
    advance: "next",
    final: true,
  },
];

// ─── Deck data ───────────────────────────────────────────────────
type DeckPerson = {
  id: string;
  name: string;
  pills: string[];
  skills: string[];
  headline: string;
  monogram: string;
};

const DECK: DeckPerson[] = [
  {
    id: "maya",
    name: "Maya Chen",
    monogram: "MC",
    pills: ["Founder", "Remote", "Full-time"],
    skills: ["Product", "Design", "Growth"],
    headline:
      "Two-time founder, last exit Series A. Building a creator-economy tool. Pre-seed, prototype live, needs a frontend owner.",
  },
  {
    id: "leo",
    name: "Leo Vance",
    monogram: "LV",
    pills: ["Founder", "NYC", "20 hrs/week"],
    skills: ["Sales", "Ops", "Fundraising"],
    headline:
      "Marketplace for vintage industrial equipment. Idea stage, looking for someone to build v1 solo.",
  },
  {
    id: "sam",
    name: "Sam Ortiz",
    monogram: "SO",
    pills: ["Founder", "Austin", "Full-time"],
    skills: ["Backend", "AI/ML", "Devtools"],
    headline:
      "B2B logistics platform, $12K MRR after 6 months. Hiring a design-minded frontend cofounder.",
  },
];

const DRAFT_MESSAGE =
  "Hi Maya! I've shipped two creator-economy frontends and your prototype looks like exactly the surface I want to own. Where's the product headed next?";

// ─── Component ───────────────────────────────────────────────────
const InteractiveDemo = () => {
  // Tour position + scripted app state.
  const [stepIndex, setStepIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>("profile");
  const [leftTab, setLeftTab] = useState<"chats" | "saved">("chats");
  const [skillAdded, setSkillAdded] = useState(false);
  const [topIndex, setTopIndex] = useState(0);
  const [swipe, setSwipe] = useState<"left" | "right" | null>(null);
  const [mayaSaved, setMayaSaved] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [replyShown, setReplyShown] = useState(false);
  // Block double-clicks while a swipe animation is mid-flight.
  const [busy, setBusy] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(0.5);

  const screenOuterRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const step = STEPS[stepIndex];

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    },
    [],
  );

  // ── Scale: fit the 1280×800 stage to whatever the screen div is.
  useEffect(() => {
    const el = screenOuterRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / STAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Fullscreen plumbing: lock scroll, exit on Escape.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  // ── Tour engine.
  const restart = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setStepIndex(0);
    setScreen("profile");
    setLeftTab("chats");
    setSkillAdded(false);
    setTopIndex(0);
    setSwipe(null);
    setMayaSaved(false);
    setMessageSent(false);
    setReplyShown(false);
    setBusy(false);
  }, []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const runAction = useCallback(
    (action: Step["action"]) => {
      switch (action) {
        case "addSkill":
          setSkillAdded(true);
          goNext();
          break;
        case "submit":
          setScreen("review");
          goNext();
          break;
        case "toMatch":
          setScreen("match");
          goNext();
          break;
        case "saveTop":
          setBusy(true);
          setSwipe("right");
          later(() => {
            setTopIndex(1);
            setSwipe(null);
            setMayaSaved(true);
            setBusy(false);
            goNext();
          }, 560);
          break;
        case "passTop":
          setBusy(true);
          setSwipe("left");
          later(() => {
            setTopIndex(2);
            setSwipe(null);
            setBusy(false);
            goNext();
          }, 560);
          break;
        case "openSaved":
          setLeftTab("saved");
          goNext();
          break;
        case "openChat":
          setScreen("chat");
          goNext();
          break;
        case "sendMessage":
          setMessageSent(true);
          // Maya replies while the next step highlights the thread,
          // so the visitor watches the exchange land inside the
          // green rectangle instead of behind the dim layer.
          later(() => setReplyShown(true), 1100);
          goNext();
          break;
        default:
          goNext();
      }
    },
    [goNext, later],
  );

  const handleNext = useCallback(() => {
    if (busy) return;
    if (step.action) runAction(step.action);
    else goNext();
  }, [busy, step, runAction, goNext]);

  const handleHoleClick = useCallback(() => {
    if (busy || step.advance !== "click") return;
    runAction(step.action);
  }, [busy, step, runAction]);

  // ── Highlight rect, measured in STAGE coordinates.
  const [rect, setRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const target = STEPS[stepIndexRef.current]?.target;
    if (!target) {
      setRect(null);
      return;
    }
    const el = stage.querySelector<HTMLElement>(`[data-demo="${target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const s = sr.width / STAGE_W;
    setRect({
      x: (r.left - sr.left) / s - RECT_PAD,
      y: (r.top - sr.top) / s - RECT_PAD,
      w: r.width / s + RECT_PAD * 2,
      h: r.height / s + RECT_PAD * 2,
    });
  }, []);

  // stepIndex lives in a ref so the (stable) measure callback always
  // reads the current step even when fired from stale timeouts.
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;

  useEffect(() => {
    measure();
    // Re-measure after layout transitions settle (expanding skills,
    // screen swaps, card swipes).
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(measure, 320);
    const t3 = window.setTimeout(measure, 650);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [
    measure,
    stepIndex,
    screen,
    leftTab,
    skillAdded,
    topIndex,
    messageSent,
    replyShown,
    scale,
    fullscreen,
  ]);

  // ── Bubble placement (stage coordinates).
  const bubble = useMemo(() => {
    if (!rect) {
      return {
        left: STAGE_W / 2 - BUBBLE_W / 2,
        top: STAGE_H / 2 - 130,
        tail: "none" as const,
      };
    }
    const spaceRight = STAGE_W - (rect.x + rect.w);
    const margin = 22;
    if (spaceRight >= BUBBLE_W + margin + 8) {
      return {
        left: rect.x + rect.w + margin,
        top: Math.min(
          Math.max(rect.y + rect.h / 2 - 90, 16),
          STAGE_H - 230,
        ),
        tail: "left" as const,
      };
    }
    if (rect.x >= BUBBLE_W + margin + 8) {
      return {
        left: rect.x - BUBBLE_W - margin,
        top: Math.min(
          Math.max(rect.y + rect.h / 2 - 90, 16),
          STAGE_H - 230,
        ),
        tail: "right" as const,
      };
    }
    if (rect.y + rect.h + 200 < STAGE_H) {
      return {
        left: Math.min(
          Math.max(rect.x + rect.w / 2 - BUBBLE_W / 2, 16),
          STAGE_W - BUBBLE_W - 16,
        ),
        top: rect.y + rect.h + margin,
        tail: "up" as const,
      };
    }
    return {
      left: Math.min(
        Math.max(rect.x + rect.w / 2 - BUBBLE_W / 2, 16),
        STAGE_W - BUBBLE_W - 16,
      ),
      top: rect.y - 200 - margin,
      tail: "down" as const,
    };
  }, [rect]);

  // ── Deck card transforms.
  const cardStyle = (i: number): React.CSSProperties => {
    const depth = i - topIndex;
    let transform = "";
    let opacity = 1;
    if (depth < 0) {
      transform = "translateX(-560px) rotate(-10deg)";
      opacity = 0;
    } else if (depth === 0 && swipe === "right") {
      transform = "translateX(560px) translateY(-16px) rotate(10deg)";
      opacity = 0;
    } else if (depth === 0 && swipe === "left") {
      transform = "translateX(-560px) translateY(-16px) rotate(-10deg)";
      opacity = 0;
    } else if (depth === 0) {
      transform = "translateY(0) scale(1)";
    } else if (depth === 1) {
      transform = "translateY(14px) scale(0.955)";
    } else {
      transform = "translateY(27px) scale(0.91)";
    }
    return {
      transform,
      opacity,
      zIndex: 10 - depth,
      transition:
        "transform 520ms cubic-bezier(0.22,0.61,0.36,1), opacity 420ms ease",
    };
  };

  // Blur-outside-the-rectangle, without backdrop-filter (Chromium
  // mis-samples backdrop-filter inside transform-scaled ancestors
  // and paints mirrored phantom copies of the UI). Instead the app
  // renders TWICE from the same state: a base copy with a regular
  // CSS blur + a dim veil over it, and a crisp copy clipped to the
  // highlight rectangle with clip-path: inset(). Both copies commit
  // in the same render, so animations stay in lockstep.
  const crispClip = rect
    ? `inset(${rect.y}px ${STAGE_W - rect.x - rect.w}px ${
        STAGE_H - rect.y - rect.h
      }px ${rect.x}px round 12px)`
    : undefined;

  const showHole = rect !== null;

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        fullscreen
          ? "fixed inset-0 z-[120] bg-background flex items-center justify-center px-6 py-12 md:px-12"
          : "relative",
      )}
    >
      <div
        className="relative w-full mx-auto"
        style={{
          maxWidth: fullscreen
            ? "min(1560px, 94vw, calc((100vh - 130px) * 1.52))"
            : 1060,
        }}
      >
        {/* "full screen" tab - tiny text sitting flush on top of the
            laptop lid, like a physical sticker on the bezel. */}
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 rounded-t-md border border-b-0 border-border bg-card px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold transition-colors"
        >
          {fullscreen ? "exit full screen" : "full screen"}
        </button>

        {/* ── Laptop lid / bezel ── */}
        <div
          className="rounded-t-[20px] p-[12px] pb-[14px]"
          style={{
            background: "#1c1e1c",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.07), 0 36px 70px -30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Camera dot */}
          <div
            className="mx-auto mb-[8px] h-[5px] w-[5px] rounded-full"
            style={{ background: "#3a3d3a" }}
          />

          {/* ── Screen (16:10) ── */}
          <div
            ref={screenOuterRef}
            className="relative overflow-hidden rounded-[10px]"
            style={{
              aspectRatio: "16 / 10",
              background: "hsl(var(--background))",
            }}
          >
            {/* Stage: fixed 1280×800 logical canvas, scaled to fit. */}
            <div
              ref={stageRef}
              className="absolute left-0 top-0 origin-top-left select-none"
              style={{
                width: STAGE_W,
                height: STAGE_H,
                transform: `scale(${scale})`,
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            >
              {/* ════ THE FAKE APP - base copy, softly blurred ════ */}
              <div
                className="absolute inset-0"
                style={{ filter: "blur(2.5px)" }}
              >
                <DemoApp
                  screen={screen}
                  leftTab={leftTab}
                  skillAdded={skillAdded}
                  topIndex={topIndex}
                  cardStyle={cardStyle}
                  mayaSaved={mayaSaved}
                  messageSent={messageSent}
                  replyShown={replyShown}
                  onRestart={restart}
                />
              </div>

              {/* Dim veil over the blurred base. */}
              <div className="absolute inset-0 z-20 bg-black/45" />

              {/* Crisp copy, clipped to the highlight rectangle. */}
              {showHole && rect && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-[25] pointer-events-none transition-[clip-path] duration-300 ease-out"
                  style={{ clipPath: crispClip }}
                >
                  <DemoApp
                    screen={screen}
                    leftTab={leftTab}
                    skillAdded={skillAdded}
                    topIndex={topIndex}
                    cardStyle={cardStyle}
                    mayaSaved={mayaSaved}
                    messageSent={messageSent}
                    replyShown={replyShown}
                    onRestart={restart}
                  />
                </div>
              )}

              {/* ════ TOUR OVERLAY ════ */}
              {showHole && rect && (
                <>
                  {/* Green outline */}
                  <div
                    className="absolute rounded-xl pointer-events-none transition-all duration-300 ease-out"
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                      border: "2.5px solid hsl(var(--primary))",
                      zIndex: 30,
                    }}
                  />
                  {/* Hole click-capture: the only clickable region.
                      For "next" steps it just swallows clicks. */}
                  <div
                    className="absolute"
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.w,
                      height: rect.h,
                      zIndex: 31,
                      cursor: step.advance === "click" ? "pointer" : "default",
                    }}
                    onClick={handleHoleClick}
                  />
                </>
              )}

              {/* ════ SPEECH BUBBLE ════ */}
              <div
                className="absolute transition-all duration-300 ease-out"
                style={{
                  left: bubble.left,
                  top: bubble.top,
                  width: BUBBLE_W,
                  zIndex: 40,
                }}
              >
                {/* Tail */}
                {bubble.tail !== "none" && (
                  <span
                    className="absolute h-[16px] w-[16px] rotate-45"
                    style={{
                      background: "hsl(var(--primary))",
                      ...(bubble.tail === "left" && {
                        left: -6,
                        top: 84,
                      }),
                      ...(bubble.tail === "right" && {
                        right: -6,
                        top: 84,
                      }),
                      ...(bubble.tail === "up" && {
                        top: -6,
                        left: BUBBLE_W / 2 - 8,
                      }),
                      ...(bubble.tail === "down" && {
                        bottom: -6,
                        left: BUBBLE_W / 2 - 8,
                      }),
                    }}
                  />
                )}
                <div
                  className="relative rounded-2xl p-5"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "#FAFAF7",
                    boxShadow: "0 24px 48px -20px rgba(0,0,0,0.45)",
                  }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-80 mb-2">
                    {stepIndex + 1} / {STEPS.length}
                  </p>
                  <p
                    data-tour-title
                    className="font-display text-[19px] font-semibold leading-tight mb-2"
                  >
                    {step.title}
                  </p>
                  <p className="text-[13.5px] leading-relaxed opacity-95 mb-4">
                    {step.text}
                  </p>

                  {step.final ? (
                    <div className="flex items-center gap-3">
                      <Link
                        to="/signup"
                        className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-bold"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        Sign up
                      </Link>
                      <button
                        type="button"
                        onClick={restart}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold underline underline-offset-4 opacity-90 hover:opacity-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Replay demo
                      </button>
                    </div>
                  ) : step.advance === "next" ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-bold"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {step.nextLabel ?? "Next"}
                    </button>
                  ) : (
                    <p className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                      <MousePointerClick className="h-4 w-4" />
                      Click the highlighted spot
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Laptop base ── */}
        <div
          className="relative mx-auto h-[18px] rounded-b-[16px]"
          style={{
            width: "108%",
            marginLeft: "-4%",
            background: "#232523",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 36px -18px rgba(0,0,0,0.55)",
          }}
        >
          {/* Thumb notch */}
          <div
            className="absolute left-1/2 top-0 h-[7px] w-[120px] -translate-x-1/2 rounded-b-[8px]"
            style={{ background: "#1a1c1a" }}
          />
        </div>
      </div>
    </div>
  );
};

// ═══ The simulated app ════════════════════════════════════════════
const DemoApp = ({
  screen,
  leftTab,
  skillAdded,
  topIndex,
  cardStyle,
  mayaSaved,
  messageSent,
  replyShown,
  onRestart,
}: {
  screen: Screen;
  leftTab: "chats" | "saved";
  skillAdded: boolean;
  topIndex: number;
  cardStyle: (i: number) => React.CSSProperties;
  mayaSaved: boolean;
  messageSent: boolean;
  replyShown: boolean;
  onRestart: () => void;
}) => {
  const urlPath =
    screen === "profile"
      ? "/app/profile/edit"
      : screen === "review"
        ? "/app/profile"
        : screen === "chat"
          ? "/app/chats"
          : "/app/match";

  return (
    <div className="flex h-full w-full flex-col">
      {/* Browser chrome */}
      <div
        className="flex h-[46px] shrink-0 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <span className="flex gap-2">
          <span className="h-3 w-3 rounded-full border border-border bg-secondary" />
          <span className="h-3 w-3 rounded-full border border-border bg-secondary" />
          <span className="h-3 w-3 rounded-full border border-border bg-secondary" />
        </span>
        <span
          className="mx-auto flex items-center rounded-full border border-border bg-secondary px-5 py-1 font-mono text-[12px] text-muted-foreground"
        >
          polln8.com{urlPath}
        </span>
        <button
          type="button"
          onClick={onRestart}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          restart
        </button>
      </div>

      {/* App body: left panel · center · right rail */}
      <div className="flex min-h-0 flex-1">
        {/* ── Left panel: Chats / Saved ── */}
        <aside
          className="flex w-[300px] shrink-0 flex-col"
          style={{ borderRight: "1px solid hsl(var(--border))" }}
        >
          <div className="px-5 pt-5 pb-3">
            <p className="font-display text-[19px] font-bold tracking-tight mb-3.5">
              Polln8
            </p>
            <div className="flex gap-2">
              <span
                className={cn(
                  "rounded-full px-4 py-1.5 text-[13px] font-medium border",
                  leftTab === "chats"
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground",
                )}
                style={
                  leftTab === "chats"
                    ? { background: "hsl(var(--primary))" }
                    : undefined
                }
              >
                Chats
              </span>
              <span
                data-demo="left-saved-tab"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium border",
                  leftTab === "saved"
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground",
                )}
                style={
                  leftTab === "saved"
                    ? { background: "hsl(var(--primary))" }
                    : undefined
                }
              >
                Saved
                {mayaSaved && (
                  <span
                    className={cn(
                      "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                      leftTab === "saved"
                        ? "bg-white"
                        : "text-white",
                    )}
                    style={
                      leftTab === "saved"
                        ? { color: "hsl(var(--primary))" }
                        : { background: "hsl(var(--primary))" }
                    }
                  >
                    2
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-3.5 pb-4">
            {leftTab === "chats" ? (
              screen === "chat" ? (
                <div
                  className="flex items-center gap-3 rounded-lg border border-gold bg-card px-3.5 py-3"
                >
                  <Monogram text="MC" size={38} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[13.5px] font-semibold leading-tight">
                      Maya Chen
                      <BadgeCheck
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "hsl(var(--primary))" }}
                      />
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {messageSent ? "You: Hi Maya! I've shipped…" : "New connection"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-8 px-3 text-center">
                  <MessageSquare className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                    No conversations yet. Chat unlocks when both sides
                    accept.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-2.5">
                {mayaSaved && (
                  <div
                    data-demo="saved-maya"
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3"
                  >
                    <Monogram text="MC" size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-[13.5px] font-semibold leading-tight">
                        Maya Chen
                        <BadgeCheck
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: "hsl(var(--primary))" }}
                        />
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        Founder · Creator tools · saved just now
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 opacity-80">
                  <Monogram text="NB" size={38} muted />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-tight">
                      Nora Beck
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Founder · Fintech · saved 2 days ago
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Center: the active surface ── */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {screen === "profile" && (
            <div className="flex flex-1 items-center justify-center p-8">
              <div
                data-demo="profile-form"
                className="w-[560px] rounded-xl border border-border bg-card p-7"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
                  Profile · step 1 of 2
                </p>
                <h3 className="font-display text-[24px] font-bold leading-tight mb-5">
                  Set up your profile
                </h3>

                <FieldLabel>Name</FieldLabel>
                <div className="mb-4 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px]">
                  Alex Rivera
                </div>

                <FieldLabel>I am a…</FieldLabel>
                <div className="mb-4 flex gap-2">
                  <span className="rounded-full border border-border px-4 py-1.5 text-[13px] text-muted-foreground">
                    Founder
                  </span>
                  <span
                    className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    Partner
                  </span>
                </div>

                <FieldLabel>Skills</FieldLabel>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    data-demo="skill-frontend"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-colors duration-300",
                      skillAdded
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground",
                    )}
                    style={
                      skillAdded
                        ? { background: "hsl(var(--primary))" }
                        : undefined
                    }
                  >
                    {skillAdded && <Check className="h-3.5 w-3.5" />}
                    Frontend
                  </span>
                  {["Backend", "Design", "Product"].map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-4 py-1.5 text-[13px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <FieldLabel>Bio</FieldLabel>
                <div className="mb-5 min-h-[64px] rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
                  Senior frontend engineer. Shipped two B2B SaaS products
                  end to end; looking to own the product surface of an
                  early-stage team.
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  data-demo="submit"
                  className="w-full rounded-lg py-3 text-[14.5px] font-bold text-white"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  Submit for review
                </button>
              </div>
            </div>
          )}

          {screen === "review" && (
            <div className="flex flex-1 items-center justify-center p-8">
              <div
                data-demo="review-card"
                className="hiw-fade w-[480px] rounded-xl border border-border bg-card p-7 text-center"
              >
                <div className="relative mx-auto mb-4 h-[76px] w-[76px]">
                  <span
                    className="flex h-full w-full items-center justify-center rounded-full text-[24px] font-semibold text-white"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    AR
                  </span>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full text-white"
                    style={{
                      background: "hsl(var(--primary))",
                      border: "3px solid hsl(var(--card))",
                    }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </div>
                <h3 className="font-display text-[22px] font-bold leading-tight mb-1.5">
                  Approved. Welcome to Polln8
                </h3>
                <p className="text-[13px] text-muted-foreground mb-5">
                  A human reviewer cleared your profile in 14 hours.
                </p>
                <div className="space-y-2 text-left">
                  {[
                    ["Submitted", "Today · 9:38 AM"],
                    ["Under review", "LinkedIn · résumé · shipped work"],
                    ["Approved", "Just now · Match is unlocked"],
                  ].map(([t, m]) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5"
                    >
                      <span
                        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: "hsl(var(--primary))" }}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-[13px] font-medium">{t}</span>
                      <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
                        {m}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {screen === "match" && (
            <div className="flex flex-1 flex-col">
              <div
                className="flex items-center justify-between px-7 py-4"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
              >
                <p className="text-[15px] font-semibold">Match</p>
                <span className="flex gap-1.5">
                  <span className="rounded-full border border-border bg-secondary px-3.5 py-1 text-[12px]">
                    For you
                  </span>
                  <span className="rounded-full px-3.5 py-1 text-[12px] text-muted-foreground">
                    Saved
                  </span>
                </span>
              </div>

              {/* Deck */}
              <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                <div
                  data-demo="deck-card"
                  className="relative h-[430px] w-[370px]"
                >
                  {DECK.map((p, i) => (
                    <DeckCard key={p.id} person={p} style={cardStyle(i)} />
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div
                className="flex items-center justify-center gap-5 px-7 py-4"
                style={{ borderTop: "1px solid hsl(var(--border))" }}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  data-demo="pass-btn"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[13.5px] font-medium text-muted-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2.4} />
                  Pass
                </button>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  ranked for you
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  data-demo="save-btn"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Bookmark className="h-4 w-4" strokeWidth={2.2} />
                  Save
                </button>
              </div>
            </div>
          )}

          {screen === "chat" && (
            <div className="flex flex-1 flex-col">
              <div
                className="flex items-center gap-3 px-7 py-4"
                style={{ borderBottom: "1px solid hsl(var(--border))" }}
              >
                <Monogram text="MC" size={40} />
                <div>
                  <p className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight">
                    Maya Chen
                    <BadgeCheck
                      className="h-4 w-4"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Founder · Creator tools · mutual connection
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-end gap-3 overflow-hidden px-7 py-5">
                <p className="mx-auto rounded-full border border-border bg-card px-4 py-1.5 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  You and Maya both accepted. Chat is open
                </p>
                {/* Message wrapper carries the "watch the exchange"
                    highlight target so both bubbles sit inside the
                    green rectangle, not behind the dim layer. */}
                <div
                  data-demo="chat-thread"
                  className="flex flex-col gap-3"
                >
                  {messageSent && (
                    <div className="hiw-fade flex justify-end">
                      <p
                        className="max-w-[420px] rounded-2xl rounded-br-md px-4 py-3 text-[13.5px] leading-relaxed text-white"
                        style={{ background: "hsl(var(--primary))" }}
                      >
                        {DRAFT_MESSAGE}
                      </p>
                    </div>
                  )}
                  {replyShown && (
                    <div className="hiw-fade flex items-end gap-2.5">
                      <Monogram text="MC" size={28} />
                      <p className="max-w-[420px] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-[13.5px] leading-relaxed">
                        Hey Alex! Great timing. I just wrote up the
                        technical spec. Want to walk through it together
                        this week?
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Composer */}
              <div
                className="flex items-center gap-3 px-7 py-4"
                style={{ borderTop: "1px solid hsl(var(--border))" }}
              >
                <div className="min-h-[44px] flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-[13.5px] leading-relaxed">
                  {messageSent ? (
                    <span className="text-muted-foreground">
                      Message Maya…
                    </span>
                  ) : (
                    DRAFT_MESSAGE
                  )}
                </div>
                <button
                  type="button"
                  tabIndex={-1}
                  data-demo="send-btn"
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Send className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── Right rail ── */}
        <aside
          className="flex w-[72px] shrink-0 flex-col items-center gap-3 pt-5"
          style={{ borderLeft: "1px solid hsl(var(--border))" }}
        >
          <RailIcon active={screen === "match" || screen === "review"}>
            <LayoutGrid className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={false}>
            <Bookmark className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={screen === "chat"}>
            <MessageSquare className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={screen === "profile"}>
            <User className="h-[18px] w-[18px]" />
          </RailIcon>
        </aside>
      </div>
    </div>
  );
};

// ─── Small demo-app atoms ────────────────────────────────────────
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
    {children}
  </p>
);

const Monogram = ({
  text,
  size,
  muted = false,
}: {
  text: string;
  size: number;
  muted?: boolean;
}) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    style={{
      width: size,
      height: size,
      fontSize: size * 0.34,
      background: muted ? "hsl(var(--secondary))" : "hsl(var(--primary))",
      color: muted ? "hsl(var(--muted-foreground))" : "#ffffff",
      border: muted ? "1px solid hsl(var(--border))" : "none",
    }}
  >
    {text}
  </span>
);

const RailIcon = ({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) => (
  <span
    className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border"
    style={{
      borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
      color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      background: "hsl(var(--card))",
    }}
  >
    {children}
  </span>
);

const DeckCard = ({
  person,
  style,
}: {
  person: DeckPerson;
  style: React.CSSProperties;
}) => (
  <div
    className="absolute inset-0 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
    style={{
      boxShadow: "0 22px 44px -22px rgba(0,0,0,0.4)",
      ...style,
    }}
  >
    <p className="flex items-center gap-1.5 text-[17px] font-semibold tracking-tight">
      {person.name}
      <BadgeCheck
        className="h-4 w-4"
        style={{ color: "hsl(var(--primary))" }}
      />
    </p>
    {/* Photo banner placeholder w/ silhouette - same language as the
        marketing mockups. */}
    <div
      className="flex w-full items-center justify-center overflow-hidden rounded-lg"
      style={{
        aspectRatio: "16 / 7",
        background: "hsl(var(--primary))",
        color: "#ffffff",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" fill="none" style={{ width: "42%" }}>
        <circle cx="32" cy="22" r="11" fill="currentColor" />
        <path
          d="M8 60 C 10 44, 22 38, 32 38 C 42 38, 54 44, 56 60 Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {person.pills.map((p) => (
        <span
          key={p}
          className="rounded-full px-3 py-1 text-[11.5px] font-medium text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          {p}
        </span>
      ))}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {person.skills.map((s) => (
        <span
          key={s}
          className="rounded-full border border-border px-3 py-1 text-[11.5px] font-medium text-muted-foreground"
        >
          {s}
        </span>
      ))}
    </div>
    <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground line-clamp-3">
      {person.headline}
    </p>
    <span
      className="mt-auto flex items-center justify-center rounded-lg py-2.5 text-[13.5px] font-bold text-white"
      style={{ background: "hsl(var(--primary))" }}
    >
      Request chat
    </span>
  </div>
);

// ═══ Section wrapper exported to the home page ════════════════════
const InteractiveDemoSection = () => (
  <section className="border-t border-border bg-card px-4 sm:px-8 py-24 md:py-32 overflow-x-clip">
    <div className="mx-auto max-w-6xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold mb-3 text-center">
        Try it
      </p>
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 text-center leading-[1.05] font-bold">
        Drive the app before you sign up.
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center mb-16">
        A two-minute guided tour of the real flow: set up a profile,
        clear review, swipe the deck, and open your first chat. Click
        the green prompts to move through it.
      </p>
      <InteractiveDemo />
    </div>
  </section>
);

export default InteractiveDemoSection;
