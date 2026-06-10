/**
 * Tour scripts + data for the home-page interactive demo.
 *
 * Two parallel perspectives, both mirroring the real app:
 *   - founder: founder wizard path, swipes PARTNER candidates,
 *     action menu = LinkedIn / resume / save / profile / message
 *     (the real CandidateActions column in src/views/Match.tsx).
 *   - partner: partner wizard path, swipes FOUNDER project cards,
 *     action menu = message / website / save (the real
 *     Polln8ProjectActions column).
 *
 * The step skeleton is identical between the two; only copy, the
 * role-card target, the deck data, and the menu icon set differ.
 * Copy rule: no em-dashes anywhere.
 */

export type Pov = "founder" | "partner";
export type Screen = "wizard" | "review" | "match";

export type ActionId =
  | "wizardContinue"
  | "pickRole"
  | "addSkill"
  | "submit"
  | "toMatch"
  | "openMenu"
  | "saveViaBookmark"
  | "passTop"
  | "openSavedTab"
  | "openConversation"
  | "sendMessage";

export type Step = {
  id: string;
  /** data-demo key of the highlight target; null = dim everything. */
  target: string | null;
  title: string;
  text: string;
  advance: "next" | "click";
  action?: ActionId;
  /** Next stays disabled until the gate's derived flag is true. */
  gate?: "review" | "reply";
  /** Label shown on the disabled Next button while gated. */
  gateLabel?: string;
  nextLabel?: string;
  final?: boolean;
};

export type DeckEntry = {
  id: string;
  /** Candidate name (founder POV) or project title (partner POV). */
  title: string;
  pills: string[];
  skills: string[];
  blurb: string;
};

export type MenuItem = {
  icon: "linkedin" | "resume" | "bookmark" | "profile" | "message" | "globe";
  label: string;
  /** Filled-gold primary button (the real Message/Chat action). */
  primary?: boolean;
};

export type DemoScript = {
  steps: Step[];
  roleTarget: "role-founder" | "role-partner";
  deck: DeckEntry[];
  menu: MenuItem[];
  chat: {
    name: string;
    monogram: string;
    sub: string;
    draft: string;
    reply: string;
    /** Preview line in the saved/contacts row. */
    savedSub: string;
  };
};

// ─── Founder perspective ─────────────────────────────────────────
const FOUNDER_STEPS: Step[] = [
  {
    id: "intro",
    target: null,
    title: "Welcome to the Polln8 demo",
    text: "This is the founder side: post what you are building, clear a human review, and swipe through partners who want in. Nothing here is a video. You will click through it yourself.",
    advance: "next",
    nextLabel: "Start the tour",
  },
  {
    id: "wiz-cred",
    target: "wiz-card",
    title: "Step 1: your credentials",
    text: "Founders drop a LinkedIn, a link to what they are building, and proof of work. A reviewer reads all of it before any partner sees you.",
    advance: "next",
  },
  {
    id: "wiz-continue",
    target: "wiz-continue",
    title: "On to step 2",
    text: "The wizard saves as you go. Click Continue.",
    advance: "click",
    action: "wizardContinue",
  },
  {
    id: "wiz-role",
    target: "role-founder",
    title: "Pick your path",
    text: "You are here to build. Click I'm a founder.",
    advance: "click",
    action: "pickRole",
  },
  {
    id: "wiz-details",
    target: "wiz-card",
    title: "Step 3: your project",
    text: "Title, what it does, the business type, and the skills you need next to you. This is exactly what partners swipe on.",
    advance: "next",
  },
  {
    id: "wiz-skill",
    target: "skill-pill",
    title: "Tag a skill you need",
    text: "Skills decide who lands in your deck. Try it: click Frontend.",
    advance: "click",
    action: "addSkill",
  },
  {
    id: "wiz-submit",
    target: "wiz-submit",
    title: "Submit for review",
    text: "Click Submit. Every profile goes to a human reviewer, not an algorithm.",
    advance: "click",
    action: "submit",
  },
  {
    id: "review-watch",
    target: "review-card",
    title: "A human checks your work",
    text: "Watch the review run: submitted, cross-checked, approved. The reviewer reads everything you dropped in step 1. Most profiles clear in under 24 hours.",
    advance: "next",
    action: "toMatch",
    gate: "review",
    gateLabel: "Reviewing",
  },
  {
    id: "match-intro",
    target: "deck-stage",
    title: "This is Match",
    text: "One partner at a time, ranked against what you need. The X on the left passes. The check on the right opens their actions.",
    advance: "next",
  },
  {
    id: "match-open",
    target: "check-btn",
    title: "Open the action menu",
    text: "Maya looks like a fit. Click the check.",
    advance: "click",
    action: "openMenu",
  },
  {
    id: "menu-save",
    target: "menu-bookmark",
    title: "Everything in one column",
    text: "LinkedIn, resume, full profile, chat: it is all right here. Click the bookmark to save Maya for later.",
    advance: "click",
    action: "saveViaBookmark",
  },
  {
    id: "match-pass",
    target: "pass-btn",
    title: "Pass works too",
    text: "Leo is not your fit. Click the X. He will not show again.",
    advance: "click",
    action: "passTop",
  },
  {
    id: "panel-saved",
    target: "left-saved-tab",
    title: "Your shortlist",
    text: "Everyone you save lands in the left panel. Click Saved.",
    advance: "click",
    action: "openSavedTab",
  },
  {
    id: "saved-open",
    target: "saved-row",
    title: "Commit when you are ready",
    text: "Compare your saves on your own time, then start the conversation. Click Maya.",
    advance: "click",
    action: "openConversation",
  },
  {
    id: "chat-send",
    target: "panel-send",
    title: "Two messages, then she decides",
    text: "Chat lives right here in the panel. You get 2 messages before Maya has to accept. Your first one is drafted. Click Send.",
    advance: "click",
    action: "sendMessage",
  },
  {
    id: "chat-watch",
    target: "panel-convo",
    title: "She accepted",
    text: "Your counter drops to 1 of 2. The moment Maya accepts, the limit lifts and the chat is open for good.",
    advance: "next",
    gate: "reply",
    gateLabel: "Waiting for Maya",
  },
  {
    id: "outro",
    target: null,
    title: "That's the whole loop",
    text: "Your project, a human review, ranked partners, a saved shortlist, and chat on your terms. The real thing takes about five minutes to set up.",
    advance: "next",
    final: true,
  },
];

// ─── Partner perspective ─────────────────────────────────────────
const PARTNER_STEPS: Step[] = [
  {
    id: "intro",
    target: null,
    title: "Welcome to the Polln8 demo",
    text: "This is the partner side: show your skills, clear a human review, and swipe through real ventures looking for someone like you. Nothing here is a video. You will click through it yourself.",
    advance: "next",
    nextLabel: "Start the tour",
  },
  {
    id: "wiz-cred",
    target: "wiz-card",
    title: "Step 1: your credentials",
    text: "Partners drop a LinkedIn and a resume. A reviewer cross-checks both against your public work before you enter anyone's deck.",
    advance: "next",
  },
  {
    id: "wiz-continue",
    target: "wiz-continue",
    title: "On to step 2",
    text: "The wizard saves as you go. Click Continue.",
    advance: "click",
    action: "wizardContinue",
  },
  {
    id: "wiz-role",
    target: "role-partner",
    title: "Pick your path",
    text: "You are here to join one. Click I'm a partner.",
    advance: "click",
    action: "pickRole",
  },
  {
    id: "wiz-details",
    target: "wiz-card",
    title: "Step 3: about you",
    text: "Your headline, a short pitch, your skills, and how much time you can commit. This is exactly what founders swipe on.",
    advance: "next",
  },
  {
    id: "wiz-skill",
    target: "skill-pill",
    title: "Add a skill",
    text: "Skills decide how your deck gets ranked. Try it: click Frontend.",
    advance: "click",
    action: "addSkill",
  },
  {
    id: "wiz-submit",
    target: "wiz-submit",
    title: "Submit for review",
    text: "Click Submit. Every profile goes to a human reviewer, not an algorithm.",
    advance: "click",
    action: "submit",
  },
  {
    id: "review-watch",
    target: "review-card",
    title: "A human checks your work",
    text: "Watch the review run: submitted, cross-checked, approved. LinkedIn, resume, and public work all have to agree. Most profiles clear in under 24 hours.",
    advance: "next",
    action: "toMatch",
    gate: "review",
    gateLabel: "Reviewing",
  },
  {
    id: "match-intro",
    target: "deck-stage",
    title: "This is Match",
    text: "One venture at a time, ranked against your skills. The X on the left passes. The check on the right opens the project's actions.",
    advance: "next",
  },
  {
    id: "match-open",
    target: "check-btn",
    title: "Open the action menu",
    text: "This one looks like your kind of build. Click the check.",
    advance: "click",
    action: "openMenu",
  },
  {
    id: "menu-save",
    target: "menu-bookmark",
    title: "Everything in one column",
    text: "Chat with the founder, open the site, or save it: all right here. Click the bookmark to save it for later.",
    advance: "click",
    action: "saveViaBookmark",
  },
  {
    id: "match-pass",
    target: "pass-btn",
    title: "Pass works too",
    text: "Idea-stage marketplace with no traction? Click the X. It will not show again.",
    advance: "click",
    action: "passTop",
  },
  {
    id: "panel-saved",
    target: "left-saved-tab",
    title: "Your shortlist",
    text: "Everything you save lands in the left panel. Click Saved.",
    advance: "click",
    action: "openSavedTab",
  },
  {
    id: "saved-open",
    target: "saved-row",
    title: "Commit when you are ready",
    text: "Compare your saves on your own time, then reach out. Click the project to message Maya, its founder.",
    advance: "click",
    action: "openConversation",
  },
  {
    id: "chat-send",
    target: "panel-send",
    title: "Two messages, then she decides",
    text: "Chat lives right here in the panel. You get 2 messages before Maya has to accept. Your first one is drafted. Click Send.",
    advance: "click",
    action: "sendMessage",
  },
  {
    id: "chat-watch",
    target: "panel-convo",
    title: "She accepted",
    text: "Your counter drops to 1 of 2. The moment Maya accepts, the limit lifts and the chat is open for good.",
    advance: "next",
    gate: "reply",
    gateLabel: "Waiting for Maya",
  },
  {
    id: "outro",
    target: null,
    title: "That's the whole loop",
    text: "Your skills, a human review, ranked ventures, a saved shortlist, and chat on your terms. The real thing takes about five minutes to set up.",
    advance: "next",
    final: true,
  },
];

// ─── Decks ───────────────────────────────────────────────────────
// Founder POV: partner candidates (people).
const FOUNDER_DECK: DeckEntry[] = [
  {
    id: "maya",
    title: "Maya Chen",
    pills: ["Partner", "Remote", "Full-time"],
    skills: ["Frontend", "Design", "Product"],
    blurb:
      "Senior frontend engineer. Shipped two B2B SaaS products end to end and wants to own the product surface of an early-stage team.",
  },
  {
    id: "leo",
    title: "Leo Vance",
    pills: ["Partner", "NYC", "10 hrs/week"],
    skills: ["Sales", "Ops"],
    blurb:
      "Agency owner exploring side projects. Open to advising but not ready to commit to a build.",
  },
  {
    id: "sam",
    title: "Sam Ortiz",
    pills: ["Partner", "Austin", "Full-time"],
    skills: ["Backend", "AI/ML", "Devtools"],
    blurb:
      "Staff engineer, ex-payments infrastructure. Looking for a venture with real users and meaningful equity.",
  },
];

// Partner POV: founder project cards (ventures).
const PARTNER_DECK: DeckEntry[] = [
  {
    id: "pollinate",
    title: "Pollinate Creator Tools",
    pills: ["Full-time", "Remote"],
    skills: ["Frontend", "Design", "Growth"],
    blurb:
      "Creator-economy tooling. Pre-seed, prototype live, first 40 teams onboarded. Needs a frontend owner.",
  },
  {
    id: "vance",
    title: "Vance Vintage Market",
    pills: ["20 hrs/week", "NYC"],
    skills: ["Backend", "Marketplaces"],
    blurb:
      "Marketplace for vintage industrial equipment. Idea stage, looking for someone to build v1 solo.",
  },
  {
    id: "ortiz",
    title: "Ortiz Logistics OS",
    pills: ["Full-time", "Austin"],
    skills: ["Frontend", "AI/ML"],
    blurb:
      "B2B logistics platform, 12K USD MRR after 6 months. Hiring a design-minded frontend cofounder.",
  },
];

// ─── Menus ───────────────────────────────────────────────────────
// Mirrors CandidateActions (founder side) and Polln8ProjectActions
// (partner side) from src/views/Match.tsx.
const FOUNDER_MENU: MenuItem[] = [
  { icon: "linkedin", label: "LinkedIn" },
  { icon: "resume", label: "Resume" },
  { icon: "bookmark", label: "Save" },
  { icon: "profile", label: "View profile" },
  { icon: "message", label: "Message", primary: true },
];

const PARTNER_MENU: MenuItem[] = [
  { icon: "message", label: "Request chat", primary: true },
  { icon: "globe", label: "Website" },
  { icon: "bookmark", label: "Save" },
];

// ─── Scripts ─────────────────────────────────────────────────────
export const SCRIPTS: Record<Pov, DemoScript> = {
  founder: {
    steps: FOUNDER_STEPS,
    roleTarget: "role-founder",
    deck: FOUNDER_DECK,
    menu: FOUNDER_MENU,
    chat: {
      name: "Maya Chen",
      monogram: "MC",
      sub: "Partner · Frontend · saved just now",
      draft:
        "Hi Maya! Your frontend work is exactly what Beacon needs next. Want to hear where the product is headed?",
      reply:
        "Hi Alex! I already poked at the prototype. I would love to walk the roadmap with you this week.",
      savedSub: "Partner · Frontend · saved just now",
    },
  },
  partner: {
    steps: PARTNER_STEPS,
    roleTarget: "role-partner",
    deck: PARTNER_DECK,
    menu: PARTNER_MENU,
    chat: {
      name: "Maya Chen",
      monogram: "MC",
      sub: "Founder · Pollinate Creator Tools",
      draft:
        "Hi Maya! I have shipped two creator-economy frontends and your prototype looks like exactly the surface I want to own. Where is the product headed next?",
      reply:
        "Hey Alex! Great timing. I just wrote up the technical spec. Want to walk through it together this week?",
      savedSub: "Pollinate Creator Tools · saved just now",
    },
  },
};
