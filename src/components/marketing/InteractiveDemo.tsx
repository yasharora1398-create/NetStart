"use client";
/**
 * Interactive laptop demo - the last section of the home page.
 *
 * A CSS laptop whose screen runs a faithful, simplified replica of
 * the /app surface (see ./demo/DemoApp.tsx). A guided tour walks the
 * visitor through the whole product loop: 3-step profile wizard,
 * human review, the real Match chrome (X / card / check + slide-in
 * action menu), the saved shortlist, and a chat that opens inside
 * the left panel with the real 2-messages-before-accept rule.
 *
 * Two perspectives, toggled by lid stickers flanking "full screen":
 * Partner view (left) and Founder view (right). Each runs its own
 * script from ./demo/demoScripts.ts. Switching restarts the tour.
 *
 * Tour mechanics:
 *   - A green rectangle outlines the current target; everything
 *     outside is dimmed and blurred. Blur is done WITHOUT
 *     backdrop-filter (Chromium paints mirrored phantoms inside
 *     transform-scaled ancestors): the app renders twice from the
 *     same state - a blurred base + a crisp copy clipped to the
 *     rectangle. The crisp copy stays permanently mounted (collapsed
 *     clip when no target) so one-shot animations never desync
 *     between the copies.
 *   - "Read" steps show Next in the speech bubble; "do" steps wait
 *     for a click on the highlighted area. Steps with a `gate` keep
 *     Next disabled until a timed in-app sequence finishes (review
 *     approval, Maya's reply).
 *
 * Proportions: the app renders at a 1280-wide logical stage scaled
 * to its container. Normal mode: 16:10 (stage height 800). Real
 * fullscreen drops the laptop chrome entirely and the stage height
 * adapts to the viewport aspect, so the app fills the whole screen
 * with zero letterboxing.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "@/lib/router-compat";
import { Loader2, MousePointerClick, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/netstart/FadeUp";
import DemoApp, { STAGE_W, type DemoAppState } from "./demo/DemoApp";
import { SCRIPTS, type Pov, type Screen, type Step } from "./demo/demoScripts";

const RECT_PAD = 10;
const BUBBLE_W = 312;

const InteractiveDemo = () => {
  // ── Tour position ──
  const [pov, setPov] = useState<Pov>("founder");
  const [stepIndex, setStepIndex] = useState(0);

  // ── Scripted app state ──
  const [screen, setScreen] = useState<Screen>("wizard");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [roleChosen, setRoleChosen] = useState(false);
  const [skillAdded, setSkillAdded] = useState(false);
  const [reviewPhase, setReviewPhase] = useState<
    "submitted" | "reviewing" | "approved"
  >("submitted");
  const [topIndex, setTopIndex] = useState(0);
  const [swipe, setSwipe] = useState<"left" | "right" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedTop, setSavedTop] = useState(false);
  const [mayaSaved, setMayaSaved] = useState(false);
  const [leftTab, setLeftTab] = useState<"contacts" | "saved">("contacts");
  const [convoOpen, setConvoOpen] = useState(false);
  const [msgCount, setMsgCount] = useState<0 | 1>(0);
  const [accepted, setAccepted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyShown, setReplyShown] = useState(false);
  const [busy, setBusy] = useState(false);

  // ── Stage geometry ──
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [stageH, setStageH] = useState(800);

  const screenOuterRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const script = SCRIPTS[pov];
  const step: Step = script.steps[stepIndex];

  // Gates: derived, timer-driven (never animationend, so
  // prefers-reduced-motion can't soft-lock the tour).
  const gateOpen =
    step.gate === "review"
      ? reviewPhase === "approved"
      : step.gate === "reply"
        ? replyShown
        : true;

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // ── Scale + adaptive stage height ──
  // Normal mode: stage is 1280x800 (16:10). Fullscreen: the height
  // adapts to the viewport aspect so the app fills the whole screen.
  useEffect(() => {
    const el = screenOuterRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w) return;
      setScale(w / STAGE_W);
      setStageH(fullscreen ? Math.max(560, Math.round((h / w) * STAGE_W)) : 800);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen]);

  // ── Fullscreen plumbing: lock scroll, exit on Escape ──
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

  // ── Tour engine ──
  const resetApp = useCallback(() => {
    clearTimers();
    setStepIndex(0);
    setScreen("wizard");
    setWizardStep(1);
    setRoleChosen(false);
    setSkillAdded(false);
    setReviewPhase("submitted");
    setTopIndex(0);
    setSwipe(null);
    setMenuOpen(false);
    setSavedTop(false);
    setMayaSaved(false);
    setLeftTab("contacts");
    setConvoOpen(false);
    setMsgCount(0);
    setAccepted(false);
    setTyping(false);
    setReplyShown(false);
    setBusy(false);
  }, [clearTimers]);

  const switchPov = useCallback(
    (p: Pov) => {
      resetApp();
      setPov(p);
    },
    [resetApp],
  );

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, script.steps.length - 1));
  }, [script.steps.length]);

  const runAction = useCallback(
    (action: Step["action"]) => {
      switch (action) {
        case "wizardContinue":
          setWizardStep(2);
          goNext();
          break;
        case "pickRole":
          // Card plays its selected animation, then the wizard
          // slides to step 3.
          setRoleChosen(true);
          setBusy(true);
          later(() => {
            setWizardStep(3);
            setBusy(false);
            goNext();
          }, 480);
          break;
        case "addSkill":
          setSkillAdded(true);
          goNext();
          break;
        case "submit":
          // Review chain runs while the gated review-watch step is
          // active; Next enables when the phase hits approved.
          setScreen("review");
          setReviewPhase("submitted");
          goNext();
          later(() => setReviewPhase("reviewing"), 600);
          later(() => setReviewPhase("approved"), 2600);
          break;
        case "toMatch":
          setScreen("match");
          goNext();
          break;
        case "openMenu":
          setMenuOpen(true);
          goNext();
          break;
        case "saveViaBookmark":
          // Bookmark fills + badge pops, the menu collapses, then
          // the card swipes off and the next one promotes.
          setSavedTop(true);
          setMayaSaved(true);
          setBusy(true);
          later(() => setMenuOpen(false), 650);
          later(() => setSwipe("right"), 1100);
          later(() => {
            setTopIndex(1);
            setSwipe(null);
            setSavedTop(false);
            setBusy(false);
            goNext();
          }, 1700);
          break;
        case "passTop":
          setBusy(true);
          setSwipe("left");
          later(() => {
            setTopIndex(2);
            setSwipe(null);
            setBusy(false);
            goNext();
          }, 580);
          break;
        case "openSavedTab":
          setLeftTab("saved");
          goNext();
          break;
        case "openConversation":
          setConvoOpen(true);
          goNext();
          break;
        case "sendMessage":
          // The gated chat-watch step is active while this chain
          // runs: counter drops, Maya accepts, types, replies.
          setMsgCount(1);
          goNext();
          later(() => setAccepted(true), 1500);
          later(() => setTyping(true), 2300);
          later(() => {
            setTyping(false);
            setReplyShown(true);
          }, 3900);
          break;
        default:
          goNext();
      }
    },
    [goNext, later],
  );

  const handleNext = useCallback(() => {
    if (busy || !gateOpen) return;
    if (step.action) runAction(step.action);
    else goNext();
  }, [busy, gateOpen, step, runAction, goNext]);

  const handleHoleClick = useCallback(() => {
    if (busy || step.advance !== "click") return;
    runAction(step.action);
  }, [busy, step, runAction]);

  // ── Highlight rect (stage coordinates) ──
  const [rect, setRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Refs so the stable measure callback always reads current values,
  // even from stale timeouts.
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;
  const stepsRef = useRef(script.steps);
  stepsRef.current = script.steps;

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const target = stepsRef.current[stepIndexRef.current]?.target;
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

  // Re-measure on every state change that can move layout, with a
  // settle cascade for CSS transitions (menu slide 500ms, wizard
  // slide 380ms, swipe 520ms).
  useEffect(() => {
    measure();
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(measure, 320);
    const t3 = window.setTimeout(measure, 650);
    const t4 = window.setTimeout(measure, 1050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [
    measure,
    pov,
    stepIndex,
    screen,
    wizardStep,
    roleChosen,
    skillAdded,
    reviewPhase,
    topIndex,
    menuOpen,
    savedTop,
    leftTab,
    convoOpen,
    msgCount,
    accepted,
    typing,
    replyShown,
    scale,
    stageH,
    fullscreen,
  ]);

  // Belt-and-braces: any CSS transition finishing inside the stage
  // re-measures, so the rect lands exactly on settled layout.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onEnd = () => measure();
    stage.addEventListener("transitionend", onEnd);
    return () => stage.removeEventListener("transitionend", onEnd);
  }, [measure, fullscreen]);

  // ── Bubble placement ──
  const bubble = useMemo(() => {
    if (!rect) {
      return {
        left: STAGE_W / 2 - BUBBLE_W / 2,
        top: stageH / 2 - 140,
        tail: "none" as const,
      };
    }
    const spaceRight = STAGE_W - (rect.x + rect.w);
    const margin = 22;
    if (spaceRight >= BUBBLE_W + margin + 8) {
      return {
        left: rect.x + rect.w + margin,
        top: Math.min(Math.max(rect.y + rect.h / 2 - 90, 16), stageH - 240),
        tail: "left" as const,
      };
    }
    if (rect.x >= BUBBLE_W + margin + 8) {
      return {
        left: rect.x - BUBBLE_W - margin,
        top: Math.min(Math.max(rect.y + rect.h / 2 - 90, 16), stageH - 240),
        tail: "right" as const,
      };
    }
    if (rect.y + rect.h + 210 < stageH) {
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
      top: Math.max(rect.y - 210 - margin, 16),
      tail: "down" as const,
    };
  }, [rect, stageH]);

  // Crisp-copy clip: collapsed (not unmounted) when there's no
  // target, so both app copies share every mount lifecycle.
  const crispClip = rect
    ? `inset(${rect.y}px ${STAGE_W - rect.x - rect.w}px ${
        stageH - rect.y - rect.h
      }px ${rect.x}px round 12px)`
    : "inset(0 100% 100% 0)";

  const appState: DemoAppState = {
    pov,
    screen,
    wizardStep,
    roleChosen,
    skillAdded,
    reviewPhase,
    topIndex,
    swipe,
    menuOpen,
    savedTop,
    mayaSaved,
    leftTab,
    convoOpen,
    msgCount,
    accepted,
    typing,
    replyShown,
    stageH,
  };

  // ── The stage (shared between laptop mode and fullscreen) ──
  const stageJsx = (
    <div
      ref={stageRef}
      className="absolute left-0 top-0 origin-top-left select-none"
      style={{
        width: STAGE_W,
        height: stageH,
        transform: `scale(${scale})`,
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
    >
      {/* Base copy, softly blurred under the dim veil. */}
      <div className="absolute inset-0" style={{ filter: "blur(2.5px)" }}>
        <DemoApp s={appState} script={script} />
      </div>

      {/* Dim veil. */}
      <div className="absolute inset-0 z-20 bg-black/45" />

      {/* Crisp copy clipped to the highlight rectangle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[25] transition-[clip-path] duration-300 ease-out"
        style={{ clipPath: crispClip }}
      >
        <DemoApp s={appState} script={script} />
      </div>

      {/* Tour overlay: green rect + pulsing hint + click capture. */}
      {rect && (
        <>
          {step.advance === "click" && !busy && (
            <span
              className="demo-ring pointer-events-none absolute rounded-xl"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                border: "2px solid hsl(var(--primary))",
                zIndex: 29,
              }}
            />
          )}
          <div
            className="pointer-events-none absolute rounded-xl transition-all duration-300 ease-out"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              border: "2.5px solid hsl(var(--primary))",
              zIndex: 30,
            }}
          />
          <div
            data-testid="tour-hole"
            className="absolute"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              zIndex: 31,
              cursor: step.advance === "click" && !busy ? "pointer" : "default",
            }}
            onClick={handleHoleClick}
          />
        </>
      )}

      {/* Speech bubble: the box glides between targets; the content
          fades per step. */}
      <div
        className="absolute transition-all duration-300 ease-out"
        style={{ left: bubble.left, top: bubble.top, width: BUBBLE_W, zIndex: 40 }}
      >
        {bubble.tail !== "none" && (
          <span
            className="absolute h-[16px] w-[16px] rotate-45"
            style={{
              background: "hsl(var(--primary))",
              ...(bubble.tail === "left" && { left: -6, top: 84 }),
              ...(bubble.tail === "right" && { right: -6, top: 84 }),
              ...(bubble.tail === "up" && { top: -6, left: BUBBLE_W / 2 - 8 }),
              ...(bubble.tail === "down" && {
                bottom: -6,
                left: BUBBLE_W / 2 - 8,
              }),
            }}
          />
        )}
        <div
          key={`${pov}-${stepIndex}`}
          className="hiw-fade relative rounded-2xl p-5"
          style={{
            background: "hsl(var(--primary))",
            color: "#FAFAF7",
            boxShadow: "0 24px 48px -20px rgba(0,0,0,0.45)",
          }}
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] opacity-80">
            {stepIndex + 1} / {script.steps.length}
          </p>
          <p
            data-tour-title
            className="mb-2 font-display text-[19px] font-semibold leading-tight"
          >
            {step.title}
          </p>
          <p className="mb-4 text-[13.5px] leading-relaxed opacity-95">
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
                onClick={resetApp}
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
              disabled={!gateOpen}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-bold transition-opacity",
                !gateOpen && "opacity-70",
              )}
              style={{ color: "hsl(var(--primary))" }}
            >
              {!gateOpen && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {gateOpen ? (step.nextLabel ?? "Next") : (step.gateLabel ?? "Wait")}
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
  );

  // ── Lid stickers: Partner view | full screen | Founder view ──
  const stickers = (
    <div
      className={cn(
        "z-[130] flex items-stretch gap-1",
        fullscreen
          ? "fixed left-1/2 top-0 -translate-x-1/2"
          : "absolute bottom-full left-1/2 -translate-x-1/2",
      )}
    >
      <StickerButton
        fullscreen={fullscreen}
        active={pov === "partner"}
        onClick={() => switchPov("partner")}
      >
        Partner view
      </StickerButton>
      <StickerButton
        fullscreen={fullscreen}
        onClick={() => setFullscreen((f) => !f)}
      >
        {fullscreen ? "exit full screen" : "full screen"}
      </StickerButton>
      <StickerButton
        fullscreen={fullscreen}
        active={pov === "founder"}
        onClick={() => switchPov("founder")}
      >
        Founder view
      </StickerButton>
      <StickerButton fullscreen={fullscreen} onClick={resetApp} ariaLabel="Restart demo">
        <RotateCcw className="h-3 w-3" />
      </StickerButton>
    </div>
  );

  // ── Fullscreen: screen content only, edge to edge ──
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[120] bg-background">
        <div ref={screenOuterRef} className="absolute inset-0 overflow-hidden">
          {stageJsx}
        </div>
        {stickers}
      </div>
    );
  }

  // ── Laptop mode ──
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 1060 }}>
      {stickers}

      {/* Lid / bezel */}
      <div
        data-testid="laptop-lid"
        className="rounded-t-[20px] p-[12px] pb-[14px]"
        style={{
          background: "#1c1e1c",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.07), 0 36px 70px -30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="mx-auto mb-[8px] h-[5px] w-[5px] rounded-full"
          style={{ background: "#3a3d3a" }}
        />
        <div
          ref={screenOuterRef}
          className="relative overflow-hidden rounded-[10px]"
          style={{ aspectRatio: "16 / 10", background: "hsl(var(--background))" }}
        >
          {stageJsx}
        </div>
      </div>

      {/* Base */}
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
        <div
          className="absolute left-1/2 top-0 h-[7px] w-[120px] -translate-x-1/2 rounded-b-[8px]"
          style={{ background: "#1a1c1a" }}
        />
      </div>
    </div>
  );
};

const StickerButton = ({
  children,
  onClick,
  active = false,
  fullscreen,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  fullscreen: boolean;
  ariaLabel?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    aria-pressed={active || undefined}
    className={cn(
      "flex items-center border border-border bg-card px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
      fullscreen ? "rounded-b-md border-t-0" : "rounded-t-md border-b-0",
      active ? "text-gold" : "text-muted-foreground hover:text-gold",
    )}
  >
    {children}
  </button>
);

// ═══ Section wrapper exported to the home page ════════════════════
const InteractiveDemoSection = () => (
  <section className="border-t border-border bg-card px-4 sm:px-8 py-24 md:py-32 overflow-x-clip">
    <div className="mx-auto max-w-6xl">
      <FadeUp>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold mb-3 text-center">
          Try it
        </p>
      </FadeUp>
      <FadeUp delay={80}>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 text-center leading-[1.05] font-bold">
          Drive the app before you sign up.
        </h2>
      </FadeUp>
      <FadeUp delay={160}>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center mb-16">
          A two-minute guided tour of the real flow: set up a profile,
          clear review, swipe the deck, and open your first chat. Click
          the green prompts to move through it, and switch sides with
          the Partner and Founder tabs.
        </p>
      </FadeUp>
      <FadeUp from="scale" durationMs={900} delay={120}>
        <InteractiveDemo />
      </FadeUp>
    </div>
  </section>
);

export default InteractiveDemoSection;
