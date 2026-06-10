/**
 * The simulated Polln8 app rendered inside the interactive demo's
 * laptop stage. Faithful miniature of the real signed-in surfaces:
 *
 *   - 3-step profile wizard (mirrors src/components/mynet/ProfileWizard.tsx)
 *   - review screen with the timed submitted -> reviewing -> approved
 *     sequence (same pattern as the marketing ReviewCardMockup)
 *   - Match desktop chrome (mirrors src/views/Match.tsx): X circle
 *     left, 400px card + Previous button, check circle right, and the
 *     slide-in action-icon column on accept
 *   - left 25% panel with Contacts/Saved tabs where the conversation
 *     opens IN the panel (mirrors src/components/netstart/AppLeftPanel.tsx),
 *     including the real 2-messages-before-accept rule copy
 *
 * Purely presentational: every piece of state lives in
 * InteractiveDemo.tsx and arrives via the `s` prop. The component
 * renders TWICE per frame (blurred base + crisp clipped copy), so
 * all motion must be driven by state changes (transitions, or
 * keyframe classes added on a state flip) so both copies stay in
 * lockstep.
 */
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  FileText,
  Globe,
  Hammer,
  LayoutGrid,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Send,
  Telescope,
  Upload,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoScript, Pov, Screen } from "./demoScripts";

export const STAGE_W = 1280;
export const PANEL_W = 320; // left panel = 25% of the stage
export const RAIL_W = 72;

export type DemoAppState = {
  pov: Pov;
  screen: Screen;
  wizardStep: 1 | 2 | 3;
  roleChosen: boolean;
  skillAdded: boolean;
  reviewPhase: "submitted" | "reviewing" | "approved";
  topIndex: number;
  swipe: "left" | "right" | null;
  menuOpen: boolean;
  savedTop: boolean;
  mayaSaved: boolean;
  leftTab: "contacts" | "saved";
  convoOpen: boolean;
  msgCount: 0 | 1;
  accepted: boolean;
  typing: boolean;
  replyShown: boolean;
  stageH: number;
};

// Warm "under review" amber, matching the marketing review mockup's
// --rc-rest so amber = in flight and green stays = approved.
const AMBER = "hsl(45 50% 70%)";

const DemoApp = ({ s, script }: { s: DemoAppState; script: DemoScript }) => {
  const urlPath =
    s.screen === "wizard"
      ? "/app/profile/edit"
      : s.screen === "review"
        ? "/app/profile"
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
        <span className="mx-auto flex items-center rounded-full border border-border bg-secondary px-5 py-1 font-mono text-[12px] text-muted-foreground">
          polln8.com{urlPath}
        </span>
        {/* Right spacer keeps the URL pill centered. */}
        <span className="w-[52px]" />
      </div>

      {/* App body: left panel · center · right rail */}
      <div className="flex min-h-0 flex-1">
        <LeftPanel s={s} script={script} />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {s.screen === "wizard" && <Wizard s={s} />}
          {s.screen === "review" && <Review s={s} />}
          {s.screen === "match" && <MatchDeck s={s} script={script} />}
        </main>

        {/* Right rail */}
        <aside
          className="flex shrink-0 flex-col items-center gap-3 pt-5"
          style={{ width: RAIL_W, borderLeft: "1px solid hsl(var(--border))" }}
        >
          <RailIcon active={s.screen === "match" || s.screen === "review"}>
            <LayoutGrid className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={s.leftTab === "saved" && !s.convoOpen}>
            <Bookmark className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={s.convoOpen}>
            <MessageSquare className="h-[18px] w-[18px]" />
          </RailIcon>
          <RailIcon active={s.screen === "wizard"}>
            <User className="h-[18px] w-[18px]" />
          </RailIcon>
        </aside>
      </div>
    </div>
  );
};

export default DemoApp;

// ═══ Left panel: Contacts / Saved / in-panel conversation ═════════
const LeftPanel = ({ s, script }: { s: DemoAppState; script: DemoScript }) => {
  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden"
      style={{ width: PANEL_W, borderRight: "1px solid hsl(var(--border))" }}
    >
      {s.convoOpen ? (
        <Conversation s={s} script={script} />
      ) : (
        <>
          {/* Tab header with one sliding gold underline. */}
          <div className="relative flex h-12 shrink-0 border-b border-border">
            <span className="flex flex-1 items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              Contacts
            </span>
            <span
              data-demo="left-saved-tab"
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]",
                s.leftTab === "saved" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
              Saved
              {s.mayaSaved && (
                <span className="demo-pop inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-foreground">
                  2
                </span>
              )}
            </span>
            {/* Sliding underline */}
            <span
              className="absolute bottom-0 h-0.5 w-1/2 bg-gold transition-[left] duration-300 ease-out"
              style={{ left: s.leftTab === "contacts" ? "0%" : "50%" }}
            />
          </div>

          {/* Tab content crossfades when the tab flips. */}
          <div key={s.leftTab} className="tab-fade min-h-0 flex-1 overflow-hidden">
            {s.leftTab === "contacts" ? (
              <div className="mt-10 px-6 text-center">
                <MessageCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  No conversations yet. Chat opens when you reach out or
                  someone messages you.
                </p>
              </div>
            ) : (
              <div className="space-y-1 px-1.5 pt-2">
                {s.mayaSaved && (
                  <button
                    type="button"
                    tabIndex={-1}
                    data-demo="saved-row"
                    className="flex w-full items-start gap-3 rounded-md px-3 py-3 text-left hover:bg-accent"
                  >
                    <Monogram text={script.chat.monogram} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {s.pov === "founder"
                          ? script.chat.name
                          : script.deck[0].title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {script.chat.savedSub}
                      </span>
                    </span>
                  </button>
                )}
                <div className="flex w-full items-start gap-3 rounded-md px-3 py-3 text-left opacity-80">
                  <Monogram text="NB" size={40} muted />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {s.pov === "founder" ? "Nora Beck" : "Beck Fintech Rails"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.pov === "founder"
                        ? "Partner · Fintech ops · saved 2 days ago"
                        : "Founder: Nora Beck · saved 2 days ago"}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

// ─── In-panel conversation (mirrors AppLeftPanel's embedded chat) ──
const Conversation = ({ s, script }: { s: DemoAppState; script: DemoScript }) => {
  const hint =
    s.accepted
      ? "Press Enter to send. Shift+Enter for a new line."
      : s.msgCount === 0
        ? "2 of 2 messages remaining until they accept."
        : "1 of 2 messages remaining until they accept.";

  return (
    <div className="demo-step-in flex min-h-0 flex-1 flex-col">
      {/* Back header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2.5">
        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Contacts
        </span>
      </div>

      <div data-demo="panel-convo" className="flex min-h-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-3 py-2.5">
          <Monogram text={script.chat.monogram} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-tight">
              {script.chat.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {script.chat.sub}
            </p>
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden px-3 py-3">
          {s.msgCount === 1 && (
            <div className="demo-bubble-in flex flex-col items-end gap-1">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-gold px-3 py-2 text-[12.5px] leading-relaxed text-primary-foreground">
                {script.chat.draft}
              </p>
              <span className="flex items-center gap-1 pr-1 text-[10px] text-muted-foreground">
                <Check className="h-3 w-3" />
                Sent
              </span>
            </div>
          )}
          {s.accepted && (
            <p className="demo-pop mx-auto rounded-full border border-gold bg-card px-3 py-1 text-center font-mono text-[9.5px] uppercase tracking-[0.12em] text-gold">
              {script.chat.name.split(" ")[0]} accepted your request
            </p>
          )}
          {s.typing && (
            <div className="flex items-end gap-2">
              <Monogram text={script.chat.monogram} size={24} />
              <span className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                <span className="demo-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span className="demo-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span className="demo-typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              </span>
            </div>
          )}
          {s.replyShown && (
            <div className="demo-bubble-in flex items-end gap-2">
              <Monogram text={script.chat.monogram} size={24} />
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-[12.5px] leading-relaxed text-foreground">
                {script.chat.reply}
              </p>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border px-3 pb-3 pt-2.5">
          <div className="flex items-end gap-2">
            <div className="min-h-[44px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed">
              {s.msgCount === 0 ? (
                script.chat.draft
              ) : (
                <span className="text-muted-foreground">Write a message</span>
              )}
            </div>
            <button
              type="button"
              tabIndex={-1}
              data-demo="panel-send"
              className="flex h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3.5 text-[12.5px] font-semibold text-primary-foreground"
            >
              Send
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 font-mono text-[9.5px] leading-snug text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══ Wizard (mirrors ProfileWizard's 3 steps) ═════════════════════
const Wizard = ({ s }: { s: DemoAppState }) => {
  const compact = s.stageH < 700;
  const isFounder = s.pov === "founder";
  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        data-demo="wiz-card"
        className={cn(
          "w-[760px] max-w-full rounded-xl border border-border bg-card",
          compact ? "p-5" : "p-7",
        )}
      >
        <Stepper step={s.wizardStep} />

        {/* Step content slides in from the right on each step change. */}
        <div key={s.wizardStep} className="demo-step-in">
          {s.wizardStep === 1 && (
            <>
              <StepHeading
                eyebrow="Step 01 of 03"
                title="Drop your credentials."
                sub={
                  isFounder
                    ? "Your LinkedIn, what you're building, and proof of work. Reviewers read all three."
                    : "Your LinkedIn and your resume. Reviewers cross-check both."
                }
                compact={compact}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>LinkedIn URL</FieldLabel>
                  <FakeInput>linkedin.com/in/alexrivera</FakeInput>
                </div>
                {isFounder ? (
                  <div>
                    <FieldLabel>What you're building</FieldLabel>
                    <FakeInput>beaconanalytics.app</FakeInput>
                  </div>
                ) : (
                  <div>
                    <FieldLabel>Resume</FieldLabel>
                    <UploadRow name="alex-rivera-resume.pdf" />
                  </div>
                )}
                {isFounder && (
                  <div className="col-span-2">
                    <FieldLabel>Proof of work</FieldLabel>
                    <UploadRow name="beacon-pitch-and-demo.pdf" />
                  </div>
                )}
              </div>
              <WizardFooter primaryLabel="Continue" primaryDemo="wiz-continue" />
            </>
          )}

          {s.wizardStep === 2 && (
            <>
              <StepHeading
                eyebrow="Step 02 of 03"
                title="What brings you here?"
                sub="Pick the path that fits today. You can always do both later."
                compact={compact}
              />
              <div className="grid grid-cols-2 gap-4">
                <RoleCard
                  demoKey="role-founder"
                  icon={<Hammer className="h-5 w-5" />}
                  tag="I'm a founder"
                  title="I have a project."
                  body="You're building a venture and you need a partner or cofounder next to you."
                  selected={s.roleChosen && isFounder}
                  dimmed={s.roleChosen && !isFounder}
                />
                <RoleCard
                  demoKey="role-partner"
                  icon={<Telescope className="h-5 w-5" />}
                  tag="I'm a partner"
                  title="I want to join one."
                  body="You're open to joining a project that fits your skills and your time."
                  selected={s.roleChosen && !isFounder}
                  dimmed={s.roleChosen && isFounder}
                />
              </div>
              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Click a card to continue.
              </p>
            </>
          )}

          {s.wizardStep === 3 && (
            <>
              <StepHeading
                eyebrow="Step 03 of 03"
                title={isFounder ? "Set up the project." : "Tell us about you."}
                sub={
                  isFounder
                    ? "What you're building and the skills you need next to you."
                    : "A short pitch and a few specifics so founders can match with you."
                }
                compact={compact}
              />
              <div className="grid grid-cols-2 gap-4">
                {isFounder ? (
                  <>
                    <div>
                      <FieldLabel>Project title</FieldLabel>
                      <FakeInput>Beacon Analytics</FakeInput>
                    </div>
                    <div>
                      <FieldLabel>Business type</FieldLabel>
                      <FakeInput chevron>B2B SaaS</FakeInput>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>Project description</FieldLabel>
                      <div
                        className={cn(
                          "rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground",
                          compact ? "min-h-[52px]" : "min-h-[64px]",
                        )}
                      >
                        Customer analytics for indie SaaS. MVP live with 12
                        pilot teams; needs a frontend owner to take the
                        dashboard to v1.
                      </div>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>Skills you need</FieldLabel>
                      <SkillPills added={s.skillAdded} />
                    </div>
                    <div>
                      <FieldLabel>Commitment</FieldLabel>
                      <FakeInput chevron>Full-time</FakeInput>
                    </div>
                    <div className="flex items-end">
                      <AvatarField />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FieldLabel>Full name</FieldLabel>
                      <FakeInput>Alex Rivera</FakeInput>
                    </div>
                    <div>
                      <FieldLabel>Best fit</FieldLabel>
                      <FakeInput chevron>Frontend Engineer</FakeInput>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>Pitch / bio</FieldLabel>
                      <div
                        className={cn(
                          "rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground",
                          compact ? "min-h-[52px]" : "min-h-[64px]",
                        )}
                      >
                        Senior frontend engineer. Shipped two B2B SaaS
                        products end to end; looking to own the product
                        surface of an early-stage team.
                      </div>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>Skills</FieldLabel>
                      <SkillPills added={s.skillAdded} />
                    </div>
                    <div>
                      <FieldLabel>Commitment</FieldLabel>
                      <FakeInput chevron>Full-time</FakeInput>
                    </div>
                    <div className="flex items-end">
                      <AvatarField />
                    </div>
                  </>
                )}
              </div>
              <WizardFooter primaryLabel="Submit" primaryDemo="wiz-submit" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const STEP_LABELS = ["Credentials", "Path", "Details"];

const Stepper = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="mb-5 flex items-center gap-2">
    {STEP_LABELS.map((label, i) => {
      const idx = i + 1;
      const done = step > idx;
      const active = step === idx;
      return (
        <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors duration-300",
              done || active
                ? "border-gold bg-gold text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : `0${idx}`}
          </span>
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-300",
              done || active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {idx < 3 && (
            <span className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
              {/* Connector fill sweeps left-to-right as steps clear. */}
              <span
                className="absolute inset-0 origin-left bg-gold transition-transform duration-500 ease-out"
                style={{ transform: done ? "scaleX(1)" : "scaleX(0)" }}
              />
            </span>
          )}
        </div>
      );
    })}
  </div>
);

const StepHeading = ({
  eyebrow,
  title,
  sub,
  compact,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  compact: boolean;
}) => (
  <div className={compact ? "mb-4" : "mb-5"}>
    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      {eyebrow}
    </p>
    <h3 className="font-display text-[22px] font-bold leading-tight">{title}</h3>
    <p className="mt-1 text-[12.5px] text-muted-foreground">{sub}</p>
  </div>
);

const WizardFooter = ({
  primaryLabel,
  primaryDemo,
}: {
  primaryLabel: string;
  primaryDemo: string;
}) => (
  <div className="mt-5 flex items-center justify-between">
    <button
      type="button"
      tabIndex={-1}
      className="rounded-lg border border-border px-5 py-2.5 text-[13px] font-medium text-muted-foreground"
    >
      Back
    </button>
    <button
      type="button"
      tabIndex={-1}
      data-demo={primaryDemo}
      className="smooth-press rounded-lg bg-gold px-7 py-2.5 text-[13.5px] font-bold text-primary-foreground"
    >
      {primaryLabel}
    </button>
  </div>
);

const RoleCard = ({
  demoKey,
  icon,
  tag,
  title,
  body,
  selected,
  dimmed,
}: {
  demoKey: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  selected: boolean;
  dimmed: boolean;
}) => (
  <div
    data-demo={demoKey}
    className={cn(
      "relative rounded-xl border bg-background p-5 transition-all duration-300",
      selected ? "scale-[1.02] border-gold" : "border-border",
      dimmed && "opacity-40",
    )}
  >
    {selected && (
      <span className="demo-pop absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-primary-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    )}
    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-gold">
      {icon}
    </span>
    <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
      {tag}
    </p>
    <p className="font-display text-[18px] font-semibold leading-tight">{title}</p>
    <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
  </div>
);

const SkillPills = ({ added }: { added: boolean }) => (
  <div className="flex flex-wrap gap-2">
    <span
      data-demo="skill-pill"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors duration-300",
        added
          ? "border-gold bg-gold text-primary-foreground"
          : "border-border text-muted-foreground",
      )}
    >
      {added && (
        <span className="demo-pop inline-flex">
          <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
        </span>
      )}
      Frontend
    </span>
    {["Backend", "Design", "Product"].map((sk) => (
      <span
        key={sk}
        className="rounded-full border border-border px-4 py-1.5 text-[13px] text-muted-foreground"
      >
        {sk}
      </span>
    ))}
  </div>
);

const AvatarField = () => (
  <div className="flex items-center gap-3">
    <Monogram text="AR" size={44} />
    <div>
      <FieldLabel>Avatar</FieldLabel>
      <p className="text-[11px] text-muted-foreground">Looks good.</p>
    </div>
  </div>
);

// ═══ Review screen: timed submitted -> reviewing -> approved ══════
const Review = ({ s }: { s: DemoAppState }) => {
  const phase = s.reviewPhase;
  const approved = phase === "approved";
  const reviewing = phase === "reviewing";

  const title = approved
    ? "Approved. Welcome to Polln8"
    : reviewing
      ? "Application under review"
      : "Application submitted";
  const sub = approved
    ? "All checks passed"
    : reviewing
      ? "Cross-checking LinkedIn, resume, and shipped work"
      : "Thanks, Alex. Sending it to a reviewer.";

  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        data-demo="review-card"
        className="w-[520px] max-w-full rounded-xl border border-border bg-card p-7 text-center"
      >
        <div className="relative mx-auto mb-4 h-[76px] w-[76px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gold text-[24px] font-semibold text-primary-foreground">
            AR
          </span>
          {/* Orbit ring: dashed while in flight, solid when approved. */}
          <span
            className={cn("absolute rounded-full", reviewing && "rc-pulse")}
            style={{
              inset: -6,
              border: `1.5px ${approved ? "solid" : "dashed"} ${
                approved
                  ? "hsl(var(--primary))"
                  : reviewing
                    ? AMBER
                    : "hsl(var(--border))"
              }`,
              opacity: approved ? 1 : reviewing ? 0.85 : 0.5,
              transition: "border-color 420ms ease, opacity 420ms ease",
            }}
          />
          {/* Approved badge pops in. */}
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-[26px] w-[26px] items-center justify-center rounded-full text-white"
            style={{
              background: "hsl(var(--primary))",
              border: "3px solid hsl(var(--card))",
              transform: approved ? "scale(1)" : "scale(0)",
              opacity: approved ? 1 : 0,
              transition:
                "transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease",
            }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        </div>

        <h3 className="mb-1 font-display text-[21px] font-bold leading-tight">
          {title}
        </h3>
        <p className="mb-5 text-[12.5px] text-muted-foreground">{sub}</p>

        <div className="space-y-2 text-left">
          <ReviewRow
            state="done"
            label="Submitted"
            meta="Today · 9:38 AM"
          />
          <ReviewRow
            state={approved ? "done" : reviewing ? "active" : "pending"}
            label="Under review"
            meta={
              approved
                ? "Cleared in 14h"
                : reviewing
                  ? "LinkedIn · resume · shipped work"
                  : "Queued for a human reviewer"
            }
          />
          <ReviewRow
            state={approved ? "done" : "pending"}
            label="Approved"
            meta={approved ? "Just now · Match is unlocked" : "Notification on file"}
          />
        </div>
      </div>
    </div>
  );
};

const ReviewRow = ({
  state,
  label,
  meta,
}: {
  state: "done" | "active" | "pending";
  label: string;
  meta: string;
}) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5">
    <span
      className={cn(
        "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white",
      )}
      style={{
        background:
          state === "done"
            ? "hsl(var(--primary))"
            : state === "active"
              ? AMBER
              : "transparent",
        border:
          state === "pending" ? "1.5px solid hsl(var(--border))" : "none",
        transition: "background 420ms ease, border-color 420ms ease",
      }}
    >
      {state === "done" && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      {state === "active" && (
        <span
          className="rc-pulse absolute rounded-full"
          style={{ inset: -4, border: `1.5px solid ${AMBER}` }}
        />
      )}
    </span>
    <span
      className="text-[13px] font-medium transition-colors duration-300"
      style={{
        color:
          state === "pending"
            ? "hsl(var(--muted-foreground))"
            : "hsl(var(--foreground))",
      }}
    >
      {label}
    </span>
    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
      {meta}
    </span>
  </div>
);

// ═══ Match deck: real desktop chrome ══════════════════════════════
const MatchDeck = ({ s, script }: { s: DemoAppState; script: DemoScript }) => {
  // Card width scales down on short fullscreen stages so the column
  // (4:3 image + body + Previous) stays inside the viewport.
  const cardW = s.stageH >= 770 ? 400 : s.stageH >= 690 ? 330 : 280;
  const cardH = Math.round(cardW * 0.75) + 188;

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="flex items-center justify-between px-7 py-3.5"
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

      {/* Deck stage: X | card column | check | slide-in action menu */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div
          data-demo="deck-stage"
          className="flex items-center justify-center gap-6 px-4"
        >
          {/* Pass (X) - slides off while the menu is open, like the
              real Match desktop chrome. */}
          <button
            type="button"
            tabIndex={-1}
            data-demo="pass-btn"
            className={cn(
              "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-destructive bg-card text-destructive shadow-sm transition-all duration-500",
              s.menuOpen && "pointer-events-none -mr-[80px] scale-75 opacity-0",
            )}
          >
            <X className="h-6 w-6" strokeWidth={2.2} />
          </button>

          {/* Card column + Previous */}
          <div
            className="flex flex-shrink-0 flex-col gap-3"
            style={{ width: cardW }}
          >
            <div className="relative" style={{ height: cardH }}>
              {script.deck.map((entry, i) => (
                <DeckCard
                  key={entry.id}
                  entry={entry}
                  pov={s.pov}
                  style={deckCardStyle(i, s.topIndex, s.swipe)}
                />
              ))}
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-card px-4 py-2.5 text-[13px] font-medium text-gold"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
          </div>

          {/* Approve (check) */}
          <button
            type="button"
            tabIndex={-1}
            data-demo="check-btn"
            className={cn(
              "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-gold bg-card text-gold shadow-sm transition-all duration-500",
              s.menuOpen && "pointer-events-none -ml-[80px] scale-75 opacity-0",
            )}
          >
            <Check className="h-6 w-6" strokeWidth={2.4} />
          </button>

          {/* Action menu - max-w slide-in, mirrors CandidateActions /
              Polln8ProjectActions. Icons stagger in when it opens. */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-out",
              s.menuOpen ? "max-w-[120px] opacity-100" : "-ml-6 max-w-0 opacity-0",
            )}
          >
            <div className="flex w-[88px] flex-col items-center gap-3">
              {script.menu.map((item, i) => {
                const isBookmark = item.icon === "bookmark";
                return (
                  <span
                    key={item.icon}
                    data-demo={isBookmark ? "menu-bookmark" : undefined}
                    aria-label={item.label}
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full border shadow-sm",
                      item.primary
                        ? "border-gold bg-gold text-primary-foreground"
                        : isBookmark && s.savedTop
                          ? "border-gold bg-gold text-primary-foreground"
                          : "border-gold bg-card text-gold",
                      s.menuOpen && "demo-icon-in",
                    )}
                    style={{ "--di": `${i * 60}ms` } as React.CSSProperties}
                  >
                    <MenuIcon icon={item.icon} saved={isBookmark && s.savedTop} />
                  </span>
                );
              })}
              <span
                aria-label="Close"
                className={cn(
                  "mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground",
                  s.menuOpen && "demo-icon-in",
                )}
                style={
                  { "--di": `${script.menu.length * 60}ms` } as React.CSSProperties
                }
              >
                <X className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuIcon = ({
  icon,
  saved,
}: {
  icon: "linkedin" | "resume" | "bookmark" | "profile" | "message" | "globe";
  saved: boolean;
}) => {
  if (icon === "bookmark") {
    return saved ? (
      <span className="demo-pop inline-flex">
        <BookmarkCheck className="h-6 w-6 fill-current" />
      </span>
    ) : (
      <Bookmark className="h-6 w-6" />
    );
  }
  if (icon === "linkedin") return <Linkedin className="h-6 w-6" />;
  if (icon === "resume") return <FileText className="h-6 w-6" />;
  if (icon === "profile") return <User className="h-6 w-6" />;
  if (icon === "globe") return <Globe className="h-6 w-6" />;
  return <MessageCircle className="h-6 w-6" />;
};

// Deck stack transforms: top card swipes out with rotation, the
// next one promotes up with a slight scale spring.
const deckCardStyle = (
  i: number,
  topIndex: number,
  swipe: "left" | "right" | null,
): React.CSSProperties => {
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
    transform = "translateY(10px) scale(0.96)";
  } else {
    transform = "translateY(20px) scale(0.92)";
  }
  return {
    transform,
    opacity,
    zIndex: 10 - depth,
    transition:
      "transform 520ms cubic-bezier(0.22,0.61,0.36,1), opacity 420ms ease",
  };
};

const DeckCard = ({
  entry,
  pov,
  style,
}: {
  entry: { id: string; title: string; pills: string[]; skills: string[]; blurb: string };
  pov: Pov;
  style: React.CSSProperties;
}) => (
  <article
    className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-gold bg-card shadow-sm"
    style={style}
  >
    {/* 4:3 image area - person silhouette for candidates, initials
        block for project cards. */}
    <div
      className="relative flex w-full items-center justify-center"
      style={{ aspectRatio: "4 / 3", background: "hsl(var(--muted))" }}
      aria-hidden
    >
      {pov === "founder" ? (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="text-muted-foreground"
          style={{ width: "44%" }}
        >
          <circle cx="32" cy="22" r="11" fill="currentColor" />
          <path
            d="M8 60 C 10 44, 22 38, 32 38 C 42 38, 54 44, 56 60 Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <span className="font-display text-[44px] font-bold text-muted-foreground">
          {entry.title
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
      )}
    </div>

    <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3.5">
      <h2 className="truncate font-display text-[19px] font-semibold leading-tight">
        {entry.title}
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {entry.pills.map((p) => (
          <span
            key={p}
            className="rounded-full border border-gold bg-gold px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground"
          >
            {p}
          </span>
        ))}
        {entry.skills.map((sk) => (
          <span
            key={sk}
            className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {sk}
          </span>
        ))}
      </div>
      <p className="text-[12px] leading-snug text-muted-foreground line-clamp-2">
        {entry.blurb}
      </p>
    </div>
  </article>
);

// ═══ Shared atoms ═════════════════════════════════════════════════
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
    {children}
  </p>
);

const FakeInput = ({
  children,
  chevron = false,
}: {
  children: React.ReactNode;
  chevron?: boolean;
}) => (
  <div className="flex h-[42px] items-center justify-between rounded-lg border border-border bg-background px-3.5 text-[13.5px]">
    <span className="truncate">{children}</span>
    {chevron && <span className="text-[10px] text-muted-foreground">▾</span>}
  </div>
);

const UploadRow = ({ name }: { name: string }) => (
  <div className="flex h-[42px] items-center gap-2.5 rounded-lg border border-dashed border-border bg-background px-3.5 text-[13px]">
    <Upload className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    <span className="truncate">{name}</span>
    <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-gold">
      <Check className="h-3 w-3" />
      Uploaded
    </span>
  </div>
);

export const Monogram = ({
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
    className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border transition-colors duration-300"
    style={{
      borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
      color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      background: "hsl(var(--card))",
    }}
  >
    {children}
  </span>
);
