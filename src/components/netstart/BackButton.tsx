"use client";
/**
 * Clear "back to wherever" button. Drops at the top of any sub-page
 * (profile editor, settings, saved, applications, paid features,
 * marketing About pages, etc.) so the user never has to hunt for
 * a way out.
 *
 * Two modes:
 *  - `to` set: hard-coded destination (e.g. profile editor always
 *    leads back to /app/profile). Predictable; survives direct-URL
 *    loads and refreshes.
 *  - `to` omitted: uses router history (`navigate(-1)`). Falls back
 *    to the home of the current section if there's no history.
 *
 * Always prefer the explicit `to` form on sub-pages with a clear
 * parent. History-back is only correct when you don't know the
 * referrer (e.g. /u/:id - could be from Match, from Saved, etc.).
 *
 * Visual: text + chevron-left, gold on hover, sits inline. Not a
 * primary button - the user knows what "Back" means without it
 * shouting at them.
 */
import { useNavigate } from "@/lib/router-compat";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
 /**
 * Destination route. When set, clicking always lands here.
 * When omitted, the component calls `navigate(-1)` to pop the
 * router history.
 */
 to?: string;
 /** Visible label. Defaults to "Back". */
 label?: string;
 /** Extra utility classes for the wrapping anchor. */
 className?: string;
};

export const BackButton = ({ to, label = "Back", className }: Props) => {
 const navigate = useNavigate();
 const onClick = () => {
 if (to) navigate(to);
 else navigate(-1);
 };
 return (
 <button
 type="button"
 onClick={onClick}
 className={cn(
 "group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-gold transition-colors mb-6",
 className,
 )}
 >
 <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
 {label}
 </button>
 );
};
