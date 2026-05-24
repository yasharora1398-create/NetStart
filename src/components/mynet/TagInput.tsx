import {
 useEffect,
 useId,
 useMemo,
 useRef,
 useState,
 type KeyboardEvent,
} from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TagInputProps = {
 value: string[];
 onChange: (next: string[]) => void;
 placeholder?: string;
 id?: string;
 /**
  * Curated option list shown in the typeahead dropdown. The user types
  * to filter, clicks to add. Empty list = free-text only (backward
  * compatible with old call sites).
  */
 options?: string[];
 /**
  * When true (default), pressing Enter on a value not in the option
  * list still commits it as a custom tag. Set false to lock the field
  * to the option list only.
  */
 allowCustom?: boolean;
};

export const TagInput = ({
 value,
 onChange,
 placeholder,
 id,
 options = [],
 allowCustom = true,
}: TagInputProps) => {
 const generatedId = useId();
 const fieldId = id ?? generatedId;
 const containerRef = useRef<HTMLDivElement | null>(null);
 const [draft, setDraft] = useState("");
 const [open, setOpen] = useState(false);
 const [highlightIdx, setHighlightIdx] = useState(0);

 // Filter the option list by the current draft, hiding any option
 // that's already been picked. Sort: startsWith first, then includes,
 // each alphabetical within group.
 const matches = useMemo(() => {
 const picked = new Set(value.map((v) => v.toLowerCase()));
 const q = draft.trim().toLowerCase();
 const startsWith: string[] = [];
 const includes: string[] = [];
 for (const opt of options) {
 if (picked.has(opt.toLowerCase())) continue;
 if (!q) {
 startsWith.push(opt);
 continue;
 }
 const lower = opt.toLowerCase();
 if (lower === q) continue;
 if (lower.startsWith(q)) startsWith.push(opt);
 else if (lower.includes(q)) includes.push(opt);
 }
 return [...startsWith, ...includes];
 }, [options, value, draft]);

 useEffect(() => {
 setHighlightIdx(0);
 }, [matches.length]);

 useEffect(() => {
 const onClick = (e: MouseEvent) => {
 if (!containerRef.current) return;
 if (!containerRef.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", onClick);
 return () => document.removeEventListener("mousedown", onClick);
 }, []);

 const addTag = (tag: string) => {
 const trimmed = tag.trim();
 if (!trimmed) return;
 if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
 setDraft("");
 return;
 }
 onChange([...value, trimmed]);
 setDraft("");
 };

 const remove = (tag: string) =>
 onChange(value.filter((v) => v !== tag));

 const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
 if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
 setOpen(true);
 e.preventDefault();
 return;
 }
 if (e.key === "ArrowDown") {
 e.preventDefault();
 setHighlightIdx((i) => Math.min(matches.length - 1, i + 1));
 } else if (e.key === "ArrowUp") {
 e.preventDefault();
 setHighlightIdx((i) => Math.max(0, i - 1));
 } else if (e.key === "Enter" || e.key === ",") {
 e.preventDefault();
 if (open && matches[highlightIdx]) {
 addTag(matches[highlightIdx]);
 } else if (allowCustom) {
 addTag(draft);
 }
 } else if (e.key === "Escape") {
 setOpen(false);
 } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
 onChange(value.slice(0, -1));
 }
 };

 return (
 <div ref={containerRef} className="space-y-2">
 <div className="relative">
 <Input
 id={fieldId}
 value={draft}
 onChange={(e) => {
 setDraft(e.target.value);
 setOpen(true);
 }}
 onFocus={() => setOpen(true)}
 onKeyDown={onKeyDown}
 autoComplete="off"
 placeholder={
 placeholder ?? "Type to filter, click to add, or press Enter"
 }
 className="h-12 bg-card border-border focus-visible:border-gold focus-visible:ring-gold pr-9"
 />
 <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
 {open && matches.length > 0 && (
 <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-80 overflow-y-auto overscroll-contain rounded-sm border border-border bg-card shadow-lg">
 <ul role="listbox" aria-labelledby={fieldId}>
 {matches.map((opt, i) => {
 const isActive = i === highlightIdx;
 return (
 <li key={opt}>
 <button
 type="button"
 onMouseEnter={() => setHighlightIdx(i)}
 onClick={() => addTag(opt)}
 className={cn(
 "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
 isActive
 ? "bg-gold text-primary-foreground"
 : "text-foreground hover:bg-accent",
 )}
 >
 <span className="truncate">{opt}</span>
 <Check className="h-3.5 w-3.5 text-gold opacity-0" />
 </button>
 </li>
 );
 })}
 </ul>
 </div>
 )}
 </div>
 {value.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {value.map((tag) => (
 <span
 key={tag}
 className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-gold bg-gold rounded-sm text-primary-foreground"
 >
 {tag}
 <button
 type="button"
 onClick={() => remove(tag)}
 aria-label={`Remove ${tag}`}
 className="text-primary-foreground hover:opacity-80 transition-opacity"
 >
 <X className="h-3 w-3" />
 </button>
 </span>
 ))}
 </div>
 )}
 </div>
 );
};
