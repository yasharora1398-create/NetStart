import maya from "@/assets/avatars/maya.jpg";
import marcus from "@/assets/avatars/marcus.jpg";
import sofia from "@/assets/avatars/sofia.jpg";
import james from "@/assets/avatars/james.jpg";
import arjun from "@/assets/avatars/arjun.jpg";
import emma from "@/assets/avatars/emma.jpg";
import zara from "@/assets/avatars/zara.jpg";
import kenji from "@/assets/avatars/kenji.jpg";
import omar from "@/assets/avatars/omar.jpg";
import clara from "@/assets/avatars/clara.jpg";
import diego from "@/assets/avatars/diego.jpg";
import riley from "@/assets/avatars/riley.jpg";

export type Role = "Founder" | "Talent";
export type Stage = "Idea" | "Prototype" | "MVP" | "Revenue";
export type Commitment = "Full-time" | "Part-time" | "Advisor";

export interface Experience {
  company: string;
  role: string;
  dates: string;
}

export interface Profile {
  id: string;
  name: string;
  photo: string;
  headline: string;
  location: string;
  role: Role;
  skills: string[];
  bio: string;
  experience: Experience[];
  // Founder fields
  startup?: string;
  pitch?: string;
  stage?: Stage;
  industry?: string;
  seekingRoles?: string[];
  equityOffered?: string;
  // Talent fields
  industries?: string[];
  commitment?: Commitment;
  equityExpected?: string;
}

export const profiles: Profile[] = [
  {
    id: "1",
    name: "Maya Chen",
    photo: maya,
    headline: "Ex-Stripe PM building the future of B2B payments",
    location: "San Francisco, CA",
    role: "Founder",
    skills: ["Product", "Fintech", "B2B Sales", "Strategy"],
    bio: "5 years at Stripe leading SMB payments. Now building rails for cross-border B2B invoicing. Looking for a technical cofounder who's shipped at scale.",
    experience: [
      { company: "Stripe", role: "Senior Product Manager", dates: "2020 - 2024" },
      { company: "Square", role: "Product Manager", dates: "2018 - 2020" },
    ],
    startup: "Lattice Pay",
    pitch: "Stripe for cross-border B2B invoicing. Built for the AP teams of 2030.",
    stage: "Prototype",
    industry: "Fintech",
    seekingRoles: ["Technical Cofounder / CTO"],
    equityOffered: "15–25%",
  },
  {
    id: "2",
    name: "Marcus Hill",
    photo: marcus,
    headline: "Staff engineer · ex-Vercel · loves zero-to-one",
    location: "Brooklyn, NY",
    role: "Talent",
    skills: ["TypeScript", "Distributed Systems", "Infra", "Rust"],
    bio: "Shipped edge runtime at Vercel. Want to build something I can't stop thinking about. Strong opinions on DX, weakly held.",
    experience: [
      { company: "Vercel", role: "Staff Software Engineer", dates: "2021 - 2024" },
      { company: "Cloudflare", role: "Senior Engineer", dates: "2018 - 2021" },
    ],
    industries: ["Developer Tools"],
    commitment: "Full-time",
    equityExpected: "10%+",
  },
  {
    id: "3",
    name: "Sofia Reyes",
    photo: sofia,
    headline: "Product Designer · 0→1 specialist",
    location: "Mexico City, MX",
    role: "Talent",
    skills: ["Product Design", "Brand", "Figma", "Design Systems"],
    bio: "Designed the first version of three apps that hit 1M users. I work fast, I prototype in public, and I want equity in something I helped name.",
    experience: [
      { company: "Linear", role: "Product Designer", dates: "2022 - 2024" },
      { company: "Notion", role: "Designer", dates: "2020 - 2022" },
    ],
    industries: ["Consumer"],
    commitment: "Full-time",
    equityExpected: "8–15%",
  },
  {
    id: "4",
    name: "James O'Connor",
    photo: james,
    headline: "Solo founder · MVP live · 200 weekly users",
    location: "Austin, TX",
    role: "Founder",
    skills: ["GTM", "Sales", "Ops", "Storytelling"],
    bio: "Bootstrapped a vertical SaaS for indie restaurants to $4k MRR. Need a CTO to take it from spaghetti code to platform.",
    experience: [
      { company: "Toast", role: "Account Executive", dates: "2019 - 2023" },
    ],
    startup: "MisePlace",
    pitch: "Vertical OS for indie restaurant groups. Inventory, scheduling, and POS in one.",
    stage: "Revenue",
    industry: "Vertical SaaS",
    seekingRoles: ["Technical Cofounder", "Engineering Lead"],
    equityOffered: "20–35%",
  },
  {
    id: "5",
    name: "Arjun Patel",
    photo: arjun,
    headline: "ML engineer · LLM eval & inference",
    location: "London, UK",
    role: "Talent",
    skills: ["LLMs", "PyTorch", "Eval", "Python"],
    bio: "Built eval pipelines at DeepMind. Want to apply LLMs to a real industry, not another wrapper. Open to relocating for the right team.",
    experience: [
      { company: "DeepMind", role: "Research Engineer", dates: "2021 - 2024" },
      { company: "Meta AI", role: "ML Engineer", dates: "2019 - 2021" },
    ],
    industries: ["AI"],
    commitment: "Full-time",
    equityExpected: "12%+",
  },
  {
    id: "6",
    name: "Emma Lindqvist",
    photo: emma,
    headline: "Growth marketer · 0→$10M ARR three times",
    location: "Stockholm, SE",
    role: "Talent",
    skills: ["Growth", "Paid Acquisition", "SEO", "Lifecycle"],
    bio: "Built growth at three Y Combinator companies. Looking for a technical or product founder with a real wedge. I'll handle the rest.",
    experience: [
      { company: "Klarna", role: "Head of Growth", dates: "2022 - 2024" },
      { company: "Hopin", role: "Senior Growth Manager", dates: "2020 - 2022" },
    ],
    industries: ["Fintech"],
    commitment: "Part-time",
    equityExpected: "5–10%",
  },
  {
    id: "7",
    name: "Zara Okonkwo",
    photo: zara,
    headline: "Founder · ex-McKinsey · building wealth tools for Africa",
    location: "Lagos, NG",
    role: "Founder",
    skills: ["Strategy", "Fundraising", "Ops", "Fintech"],
    bio: "Pre-seed wealth platform for African professionals. Closed first $400k. Need a senior engineer to architect the platform.",
    experience: [
      { company: "McKinsey & Co.", role: "Engagement Manager", dates: "2019 - 2023" },
      { company: "Flutterwave", role: "Strategy Lead", dates: "2023 - 2024" },
    ],
    startup: "Nile Wealth",
    pitch: "Wealthfront for emerging-market professionals. Save, invest, and hedge in dollars.",
    stage: "MVP",
    industry: "Fintech",
    seekingRoles: ["CTO", "Lead Engineer"],
    equityOffered: "10–20%",
  },
  {
    id: "8",
    name: "Kenji Watanabe",
    photo: kenji,
    headline: "UI engineer · half designer, half dev",
    location: "Tokyo, JP",
    role: "Talent",
    skills: ["React", "Motion", "Design Engineering", "WebGL"],
    bio: "I make products that feel alive. Looking for a founder who cares about craft as much as I do.",
    experience: [
      { company: "Framer", role: "Design Engineer", dates: "2022 - 2024" },
      { company: "Rauno (studio)", role: "Founder", dates: "2019 - 2022" },
    ],
    industries: ["Creator Economy"],
    commitment: "Full-time",
    equityExpected: "10–18%",
  },
  {
    id: "9",
    name: "Omar Hadid",
    photo: omar,
    headline: "Operator · scaled marketplaces from 0 to 7-figure GMV",
    location: "Dubai, UAE",
    role: "Talent",
    skills: ["Operations", "Marketplace", "Hiring", "Finance"],
    bio: "I build the muscle behind the magic. Hired the first 50 at two startups. Want a founder with an unfair distribution edge.",
    experience: [
      { company: "Careem", role: "Director of Ops", dates: "2020 - 2024" },
      { company: "Noon", role: "Ops Manager", dates: "2018 - 2020" },
    ],
    industries: ["Marketplace"],
    commitment: "Full-time",
    equityExpected: "8–15%",
  },
  {
    id: "10",
    name: "Clara Whitfield",
    photo: clara,
    headline: "Climate-tech founder · materials science PhD",
    location: "Berlin, DE",
    role: "Founder",
    skills: ["R&D", "Climate", "Hardware", "Fundraising"],
    bio: "Spinning out a low-carbon cement startup from TU Berlin. $1.2M grant secured. Need a cofounder who can productize hard-tech.",
    experience: [
      { company: "TU Berlin", role: "PostDoc Researcher", dates: "2021 - 2024" },
    ],
    startup: "Stoneless",
    pitch: "Carbon-negative cement that costs the same as Portland. We've got the lab data. Now we need the company.",
    stage: "Idea",
    industry: "Climate",
    seekingRoles: ["Operating Cofounder", "Engineering Lead"],
    equityOffered: "20–40%",
  },
  {
    id: "11",
    name: "Diego Morales",
    photo: diego,
    headline: "Sales leader · sold to F500 · ex-Salesforce",
    location: "Miami, FL",
    role: "Talent",
    skills: ["Enterprise Sales", "Partnerships", "GTM", "Spanish/EN"],
    bio: "I close deals others say are impossible. Looking for a B2B founder with a real product. Let's go enterprise.",
    experience: [
      { company: "Salesforce", role: "Enterprise AE", dates: "2021 - 2024" },
      { company: "Gong", role: "AE", dates: "2019 - 2021" },
    ],
    industries: ["B2B SaaS"],
    commitment: "Full-time",
    equityExpected: "6–12%",
  },
  {
    id: "12",
    name: "Riley Park",
    photo: riley,
    headline: "Founder · prototype live · AI for special education",
    location: "Toronto, CA",
    role: "Founder",
    skills: ["Product", "AI", "Education", "Research"],
    bio: "Former special-ed teacher turned product lead. Built a prototype with 12 schools using it weekly. Need a senior engineer to scale.",
    experience: [
      { company: "Khan Academy", role: "Product Lead", dates: "2022 - 2024" },
      { company: "Toronto DSB", role: "Special Ed Teacher", dates: "2017 - 2022" },
    ],
    startup: "Lumen Learn",
    pitch: "AI co-pilot that helps special-ed teachers personalize lesson plans in minutes, not hours.",
    stage: "Prototype",
    industry: "EdTech",
    seekingRoles: ["Technical Cofounder"],
    equityOffered: "18–28%",
  },
];

export const myProfile: Profile = {
  id: "me",
  name: "Alex Rivera",
  photo: james,
  headline: "Building something new · ex-Airbnb · open to cofounders",
  location: "San Francisco, CA",
  role: "Founder",
  skills: ["Product", "Design", "Strategy", "AI"],
  bio: "Spent 6 years building Airbnb's host experience. Now exploring AI tools for small businesses. Looking for a technical cofounder with strong opinions.",
  experience: [
    { company: "Airbnb", role: "Senior Product Manager", dates: "2018 - 2024" },
    { company: "Dropbox", role: "Product Manager", dates: "2016 - 2018" },
  ],
  startup: "Stealth",
  pitch: "AI agents for solopreneurs. Automate the busywork, focus on the craft.",
  stage: "Idea",
  industry: "AI",
  seekingRoles: ["Technical Cofounder"],
  equityOffered: "20–35%",
};
