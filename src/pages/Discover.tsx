import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SwipeCard } from "@/components/SwipeCard";
import { ProfileDetail } from "@/components/ProfileDetail";
import { profiles, Profile } from "@/data/profiles";
import { ANY_GENRE, GENRE_OPTIONS, Genre, isCompatible } from "@/data/genres";
import { Heart, RotateCcw, Sliders } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AUTH_EVENT, readProfile } from "@/lib/auth";
import { AnimatedText } from "@/components/AnimatedText";

type GenreFilter = "Auto" | Genre;

const Discover = () => {
  const [me, setMe] = useState<Profile | null>(() => readProfile());
  const [genreFilter, setGenreFilter] = useState<GenreFilter>("Auto");

  useEffect(() => {
    const sync = () => setMe(readProfile());
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  const filtered = useMemo(() => {
    if (!me) return [] as Profile[];
    if (genreFilter === "Auto") return profiles.filter((p) => isCompatible(me, p));
    // Manual genre override: still restrict to opposite role, but match the chosen genre.
    const override: Profile = { ...me } as Profile;
    if (me.role === "Founder") override.industry = genreFilter;
    else override.industries = [genreFilter];
    return profiles.filter((p) => isCompatible(override, p));
  }, [me, genreFilter]);

  const [stack, setStack] = useState<Profile[]>(filtered);
  const [history, setHistory] = useState<Profile[]>([]);
  const [detail, setDetail] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setStack(filtered);
    setHistory([]);
  }, [filtered]);

  const top = stack[0];

  const handleSwipe = (dir: "left" | "right" | "up") => {
    if (!top) return;
    const swiped = top;
    setHistory((h) => [swiped, ...h]);
    setStack((s) => s.slice(1));
    if (dir === "right") {
      setDetail(swiped);
      setOpen(true);
    } else if (dir === "up") {
      toast({
        title: `Super interested in ${swiped.name.split(" ")[0]} ⚡`,
        description: "They'll see you at the top of their stack.",
      });
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setHistory(rest);
    setStack((s) => [last, ...s]);
  };

  const openDetail = () => {
    if (!top) return;
    setDetail(top);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      if (e.key === "ArrowLeft") handleSwipe("left");
      else if (e.key === "ArrowRight") handleSwipe("right");
      else if (e.key === "ArrowUp") handleSwipe("up");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const oppositeRoleLabel = me?.role === "Founder" ? "talent" : "founders";
  const myGenre = me
    ? me.role === "Founder"
      ? me.industry
      : me.industries?.[0]
    : undefined;

  return (
    <AppShell
      showLogo
      fillHeight
      rightSlot={
        <Sheet>
          <SheetTrigger asChild>
            <button
              aria-label="Filters"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/20 bg-card text-foreground/80 hover:text-foreground hover:border-foreground/50 transition"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="border-l-2 border-foreground bg-background">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl font-black">Filters</SheetTitle>
              <SheetDescription>
                Showing {oppositeRoleLabel}
                {myGenre ? ` in ${myGenre}` : ""}.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <p className="mb-2 font-display text-xs font-black uppercase tracking-wider text-tertiary">
                Genre
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGenreFilter("Auto")}
                  className={`rounded-xl border-2 py-2.5 font-display text-xs font-black transition-all ${
                    genreFilter === "Auto"
                      ? "border-foreground bg-primary text-primary-foreground shadow-pop-white"
                      : "border-foreground/20 bg-card text-foreground/70 hover:text-foreground"
                  }`}
                >
                  Auto (my genre)
                </button>
                {GENRE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g)}
                    className={`rounded-xl border-2 py-2.5 font-display text-xs font-black transition-all ${
                      genreFilter === g
                        ? "border-foreground bg-primary text-primary-foreground shadow-pop-white"
                        : "border-foreground/20 bg-card text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {g === ANY_GENRE ? "Anything" : g}
                  </button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="flex h-full flex-col px-5 pb-2 pt-2">
        {/* Card stack - swipe only. Left = pass, right = open profile, up = super. */}
        <div className="relative mx-auto w-full max-w-sm flex-1 min-h-0">
          {stack.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[32px] border-2 border-foreground/20 bg-card text-center px-6">
              <div className="mb-4 flex h-16 w-16 rotate-[-6deg] items-center justify-center rounded-2xl border-2 border-foreground bg-pop-pink shadow-pop-white">
                <Heart className="h-8 w-8 text-background" fill="currentColor" />
              </div>
              <AnimatedText
                as="h3"
                text="You're all caught up!"
                className="font-display text-2xl font-black"
                delay={1000}
                stagger={80}
              />
              <AnimatedText
                as="p"
                text={
                  me
                    ? `No more ${oppositeRoleLabel}${myGenre ? ` in ${myGenre}` : ""} right now. Try a different genre in Filters, or undo your last pass.`
                    : "Check back soon, or undo your last pass."
                }
                className="mt-2 max-w-[260px] text-sm text-secondary-soft"
                delay={1180}
                stagger={35}
              />
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-pop-white disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> Undo
              </button>
            </div>
          ) : (
            stack
              .slice(0, 3)
              .reverse()
              .map((p, i, arr) => {
                const realIndex = arr.length - 1 - i;
                return (
                  <SwipeCard
                    key={p.id}
                    profile={p}
                    onSwipe={handleSwipe}
                    onTap={openDetail}
                    isTop={realIndex === 0}
                    index={realIndex}
                  />
                );
              })
          )}
        </div>

        {/* Swipe hint - replaces the action button bar */}
        {stack.length > 0 && (
          <div className="mt-3 flex shrink-0 items-center justify-center gap-4 pb-2 text-[10px] font-black uppercase tracking-wider text-tertiary">
            <span className="animate-text-reveal" style={{ animationDelay: "1100ms" }}>← Pass</span>
            <span className="animate-text-reveal text-pop-pink" style={{ animationDelay: "1200ms" }}>↑ Super</span>
            <span className="animate-text-reveal" style={{ animationDelay: "1300ms" }}>Like →</span>
          </div>
        )}
      </div>

      <ProfileDetail profile={detail} open={open} onOpenChange={setOpen} />
    </AppShell>
  );
};

export default Discover;
