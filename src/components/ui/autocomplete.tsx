import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type AutocompleteProps = {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  allowCustom?: boolean;
  maxResults?: number;
};

export const Autocomplete = ({
  value,
  onChange,
  options,
  placeholder,
  id,
  className,
  inputClassName,
  allowCustom = true,
  maxResults = 8,
}: AutocompleteProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, maxResults);
    const startsWith: string[] = [];
    const includes: string[] = [];
    for (const opt of options) {
      const lower = opt.toLowerCase();
      if (lower === q) continue;
      if (lower.startsWith(q)) startsWith.push(opt);
      else if (lower.includes(q)) includes.push(opt);
    }
    return [...startsWith, ...includes].slice(0, maxResults);
  }, [value, options, maxResults]);

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

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    } else if (e.key === "Enter") {
      if (open && matches[highlightIdx]) {
        e.preventDefault();
        commit(matches[highlightIdx]);
      } else if (allowCustom) {
        setOpen(false);
      } else {
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={fieldId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "h-11 bg-background border-border focus-visible:border-gold/60 focus-visible:ring-gold/20 pr-9",
            inputClassName,
          )}
        />
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-sm border border-border bg-card shadow-lg">
          <ul role="listbox" aria-labelledby={fieldId}>
            {matches.map((opt, i) => {
              const isActive = i === highlightIdx;
              const isSelected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightIdx(i)}
                    onClick={() => commit(opt)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                      isActive
                        ? "bg-gold/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-gold" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
