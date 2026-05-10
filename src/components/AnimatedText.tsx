import { ElementType, Fragment, ReactNode } from "react";

interface AnimatedTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay before the first word starts, in ms. */
  delay?: number;
  /** Delay between each word, in ms. */
  stagger?: number;
  /** Optional trailing content (e.g. an inline icon) appended after the last word. */
  trailing?: ReactNode;
}

export const AnimatedText = ({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 55,
  trailing,
}: AnimatedTextProps) => {
  const words = text.split(" ");
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="inline-block animate-text-reveal will-change-transform"
            style={{ animationDelay: `${delay + i * stagger}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
      {trailing ? (
        <span
          className="inline-block animate-text-reveal will-change-transform"
          style={{ animationDelay: `${delay + words.length * stagger}ms` }}
        >
          {trailing}
        </span>
      ) : null}
    </Tag>
  );
};
