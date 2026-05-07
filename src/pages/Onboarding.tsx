import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import {
  Commitment,
  Profile,
  Role,
  Stage,
} from "@/data/profiles";
import { ANY_GENRE, GENRE_OPTIONS, Genre } from "@/data/genres";
import mascot from "@/assets/netstart-mascot.png";
import { Camera, Plus, Trash2 } from "lucide-react";
import { markOnboarded, writeProfile } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ExpRow {
  company: string;
  role: string;
  dates: string;
}

const STAGES: Stage[] = ["Idea", "Prototype", "MVP", "Revenue"];
const COMMITMENTS: Commitment[] = ["Full-time", "Part-time", "Advisor"];

const parseList = (s: string): string[] =>
  s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [photo, setPhoto] = useState<string>(mascot);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<Role>("Founder");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState<ExpRow[]>([
    { company: "", role: "", dates: "" },
  ]);

  // Founder fields
  const [startup, setStartup] = useState("");
  const [pitch, setPitch] = useState("");
  const [stage, setStage] = useState<Stage>("Idea");
  const [industry, setIndustry] = useState<Genre | "">("");
  const [seekingRoles, setSeekingRoles] = useState("");
  const [equityOffered, setEquityOffered] = useState("");

  // Talent fields
  const [targetGenre, setTargetGenre] = useState<Genre | "">("");
  const [commitment, setCommitment] = useState<Commitment>("Full-time");
  const [equityExpected, setEquityExpected] = useState("");

  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "That's not an image", description: "Pick a JPG, PNG, or GIF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Keep it under 5MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addExp = () =>
    setExperience((rows) => [...rows, { company: "", role: "", dates: "" }]);

  const removeExp = (i: number) =>
    setExperience((rows) => rows.filter((_, idx) => idx !== i));

  const updateExp = (i: number, field: keyof ExpRow, value: string) =>
    setExperience((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Add your name.");
    if (!headline.trim()) return setError("Add a headline. One line.");
    if (!location.trim()) return setError("Where are you based?");
    if (!bio.trim()) return setError("Tell people who you are.");
    const skillList = parseList(skills);
    if (skillList.length === 0) return setError("Add at least one skill.");
    const exp = experience.filter((r) => r.company.trim() && r.role.trim());
    if (exp.length === 0) return setError("Add at least one experience.");

    if (role === "Founder") {
      if (!startup.trim()) return setError("What are you building?");
      if (!pitch.trim()) return setError("Add a one-line pitch.");
      if (!industry) return setError("Pick a genre.");
      if (!equityOffered.trim()) return setError("How much equity are you offering?");
    } else {
      if (!targetGenre) return setError("Pick the genre you want to join.");
      if (!equityExpected.trim()) return setError("What equity are you expecting?");
    }

    const profile: Profile = {
      id: "me",
      name: name.trim(),
      photo,
      headline: headline.trim(),
      location: location.trim(),
      role,
      skills: skillList,
      bio: bio.trim(),
      experience: exp,
      ...(role === "Founder"
        ? {
            startup: startup.trim(),
            pitch: pitch.trim(),
            stage,
            industry,
            seekingRoles: parseList(seekingRoles),
            equityOffered: equityOffered.trim(),
          }
        : {
            industries: [targetGenre],
            commitment,
            equityExpected: equityExpected.trim(),
          }),
    };

    writeProfile(profile);
    markOnboarded();
    toast({ title: "You're in 🎉", description: "Start swiping to find your crew." });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-24 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <Logo size="md" />
          <span className="rounded-full border-2 border-foreground bg-pop-yellow px-3 py-1 text-[10px] font-black uppercase tracking-wider text-background">
            Step 2 of 2
          </span>
        </div>

        <h1 className="font-display text-3xl font-black tracking-tight">Build your profile</h1>
        <p className="mt-1 text-sm text-secondary-soft">
          Fill this out so cofounders can find you. You can tweak anything later.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* Photo */}
          <Section title="Profile photo">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-foreground bg-pop-green">
                <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickPhoto}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-card px-3 py-2 text-xs font-black"
                >
                  <Camera className="h-3.5 w-3.5" /> Upload photo
                </Button>
                <p className="text-[11px] text-tertiary">JPG or PNG · under 5MB</p>
              </div>
            </div>
          </Section>

          {/* Basics */}
          <Section title="About you">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="h-11 border-2 border-foreground/20"
              />
            </Field>
            <Field label="Headline">
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Building AI tools · ex-Airbnb · open to cofounders"
                className="h-11 border-2 border-foreground/20"
              />
            </Field>
            <Field label="Location">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                className="h-11 border-2 border-foreground/20"
              />
            </Field>
            <Field label="Bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What's your story? What are you excited about?"
                rows={4}
                className="border-2 border-foreground/20"
              />
            </Field>
          </Section>

          {/* Role */}
          <Section title="I'm joining as">
            <div className="grid grid-cols-2 gap-2">
              {(["Founder", "Talent"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border-2 py-3 font-display text-sm font-black transition-all ${
                    role === r
                      ? "border-foreground bg-primary text-primary-foreground shadow-pop-white"
                      : "border-foreground/20 bg-card text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <Field label="Top skills (comma-separated)">
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Product, Design, Strategy, AI"
                className="h-11 border-2 border-foreground/20"
              />
            </Field>
          </Section>

          {/* Experience */}
          <Section title="Experience">
            <div className="space-y-3">
              {experience.map((row, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-2xl border-2 border-foreground/15 bg-card p-3"
                >
                  <Input
                    value={row.company}
                    onChange={(e) => updateExp(i, "company", e.target.value)}
                    placeholder="Company"
                    className="h-10 border-2 border-foreground/20"
                  />
                  <Input
                    value={row.role}
                    onChange={(e) => updateExp(i, "role", e.target.value)}
                    placeholder="Role"
                    className="h-10 border-2 border-foreground/20"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      value={row.dates}
                      onChange={(e) => updateExp(i, "dates", e.target.value)}
                      placeholder="2020 - 2024"
                      className="h-10 flex-1 border-2 border-foreground/20"
                    />
                    {experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExp(i)}
                        aria-label="Remove experience"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/20 bg-card text-foreground/60 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addExp}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/20 bg-card px-3 py-2 text-xs font-black text-foreground/80 hover:text-foreground hover:border-foreground/50"
              >
                <Plus className="h-3.5 w-3.5" /> Add experience
              </button>
            </div>
          </Section>

          {/* Role-specific */}
          {role === "Founder" ? (
            <Section title="What you're building">
              <Field label="Startup name">
                <Input
                  value={startup}
                  onChange={(e) => setStartup(e.target.value)}
                  placeholder="Stealth / My awesome idea"
                  className="h-11 border-2 border-foreground/20"
                />
              </Field>
              <Field label="One-line pitch">
                <Input
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="AI agents for solopreneurs. Automate the busywork."
                  className="h-11 border-2 border-foreground/20"
                />
              </Field>
              <Field label="Stage">
                <div className="grid grid-cols-4 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className={`rounded-xl border-2 py-2 text-xs font-black transition-all ${
                        stage === s
                          ? "border-foreground bg-pop-yellow text-background"
                          : "border-foreground/20 bg-card text-foreground/70"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Genre">
                <Select value={industry} onValueChange={(v) => setIndustry(v as Genre)}>
                  <SelectTrigger className="h-11 border-2 border-foreground/20">
                    <SelectValue placeholder="Pick the genre you're building in" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g === ANY_GENRE ? "Anything (any genre)" : g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Seeking (comma-separated)">
                <Input
                  value={seekingRoles}
                  onChange={(e) => setSeekingRoles(e.target.value)}
                  placeholder="Technical Cofounder, Designer"
                  className="h-11 border-2 border-foreground/20"
                />
              </Field>
              <Field label="Equity offered">
                <Input
                  value={equityOffered}
                  onChange={(e) => setEquityOffered(e.target.value)}
                  placeholder="20–35%"
                  className="h-11 border-2 border-foreground/20"
                />
              </Field>
            </Section>
          ) : (
            <Section title="What you're looking for">
              <Field label="Genre you want to join">
                <Select value={targetGenre} onValueChange={(v) => setTargetGenre(v as Genre)}>
                  <SelectTrigger className="h-11 border-2 border-foreground/20">
                    <SelectValue placeholder="Pick the genre you want to join" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g === ANY_GENRE ? "Anything (any genre)" : g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Commitment">
                <div className="grid grid-cols-3 gap-2">
                  {COMMITMENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCommitment(c)}
                      className={`rounded-xl border-2 py-2 text-xs font-black transition-all ${
                        commitment === c
                          ? "border-foreground bg-pop-pink text-background"
                          : "border-foreground/20 bg-card text-foreground/70"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Minimum equity expected">
                <Input
                  value={equityExpected}
                  onChange={(e) => setEquityExpected(e.target.value)}
                  placeholder="5%"
                  className="h-11 border-2 border-foreground/20"
                />
              </Field>
            </Section>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border-2 border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full border-2 border-foreground bg-primary py-6 font-display text-base font-black text-primary-foreground shadow-pop-white hover:bg-primary/90 transition"
          >
            Finish & start swiping →
          </Button>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-display text-xs font-black uppercase tracking-wider text-tertiary">
      {title}
    </h2>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[11px] font-black uppercase tracking-wider text-tertiary">{label}</Label>
    {children}
  </div>
);

export default Onboarding;
