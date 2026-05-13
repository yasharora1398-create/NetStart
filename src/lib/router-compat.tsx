"use client";

/**
 * react-router-dom -> next/navigation compatibility layer.
 *
 * The pre-Next codebase used react-router-dom everywhere (37 files).
 * Rewriting each call site to native next/navigation idioms would
 * have been a thousand surgical edits. Instead this shim exposes the
 * same import names with matching signatures, implemented under the
 * hood with Next.js's router primitives. Every file just changes its
 * import path; the call sites stay byte-identical.
 *
 * The pieces:
 *   - Link  -> wraps next/link but accepts both `to` and `href`
 *             so JSX written as <Link to="/x"> keeps working.
 *   - NavLink -> Link variant that exposes the active-state pattern
 *             react-router's NavLink had (className/style functions
 *             that receive { isActive }). Compares pathname against
 *             the target.
 *   - Navigate -> declarative redirect; fires router.replace once on
 *             mount, returns null. Drop-in replacement for react-router's
 *             <Navigate to=... replace /> usage.
 *   - useNavigate -> returns a function that mirrors react-router's
 *             navigate(to, opts). String paths route via push/replace;
 *             integer args (-1) call router.back().
 *   - useLocation -> returns { pathname, search, hash, state } shaped
 *             like react-router's location. `state` is null since
 *             Next doesn't carry router state across navigations;
 *             call sites that depended on it should encode the same
 *             data into query params instead.
 *   - useParams -> re-exported from next/navigation (matching shape).
 *
 * Caveats:
 *   - location.state always reads as null. The few places that wrote
 *     to it (SignIn / SignUp "from" tracking, AuthGate) need a small
 *     refactor to use query params; those are fixed in-line.
 *   - `relative` paths in <Link to="../x"> don't work the same way.
 *     The codebase only uses absolute paths so this isn't an issue.
 */
import NextLink from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams as nextUseParams,
} from "next/navigation";
import { useEffect, type AnchorHTMLAttributes, type CSSProperties, type ReactNode } from "react";

// ---------- Link --------------------------------------------------

type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  to?: string;
  href?: string;
  replace?: boolean;
  prefetch?: boolean;
  state?: unknown;
  children?: ReactNode;
};

export const Link = ({ to, href, state: _state, replace: _replace, prefetch, ...rest }: LinkProps) => {
  const dest = href ?? to ?? "#";
  return <NextLink href={dest} prefetch={prefetch} {...rest} />;
};

// ---------- NavLink -----------------------------------------------

type NavLinkClassNameFn = (state: { isActive: boolean }) => string;
type NavLinkStyleFn = (state: { isActive: boolean }) => CSSProperties;

type NavLinkProps = Omit<LinkProps, "className" | "style"> & {
  end?: boolean;
  className?: string | NavLinkClassNameFn;
  style?: CSSProperties | NavLinkStyleFn;
};

export const NavLink = ({ to, href, end, className, style, children, ...rest }: NavLinkProps) => {
  const dest = href ?? to ?? "#";
  const pathname = usePathname() ?? "/";
  const isActive = end
    ? pathname === dest
    : pathname === dest || pathname.startsWith(dest + "/");
  const computedClass =
    typeof className === "function" ? className({ isActive }) : className;
  const computedStyle =
    typeof style === "function" ? style({ isActive }) : style;
  return (
    <NextLink
      href={dest}
      className={computedClass}
      style={computedStyle}
      {...rest}
    >
      {children}
    </NextLink>
  );
};

// ---------- Navigate (declarative redirect) ----------------------

type NavigateProps = {
  to: string;
  replace?: boolean;
  state?: unknown;
};

export const Navigate = ({ to, replace = false }: NavigateProps) => {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);
  return null;
};

// ---------- useNavigate -------------------------------------------

type NavigateOptions = { replace?: boolean; state?: unknown };
type NavigateFunction = ((to: string | number, options?: NavigateOptions) => void);

export const useNavigate = (): NavigateFunction => {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === "number") {
      // Only -1 / 1 supported in react-router; map to back()/forward().
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
};

// ---------- useLocation -------------------------------------------

type Location = {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
};

export const useLocation = (): Location => {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const search = searchParams && searchParams.toString().length
    ? `?${searchParams.toString()}`
    : "";
  // Next doesn't expose the hash on the server; client-only reads
  // are safe because every consumer of this is "use client".
  const hash =
    typeof window !== "undefined" ? window.location.hash : "";
  return {
    pathname,
    search,
    hash,
    // react-router used to carry navigation state on this field; Next
    // has no equivalent. Sites that read it should fall back to a
    // sensible default (an empty object or null).
    state: null,
    key: "default",
  };
};

// ---------- useParams ---------------------------------------------

// Next.js's useParams returns `Record<string, string | string[]> | null`.
// react-router's was always an object. Wrap so we hand back a stable
// object even when the route has no params.
export const useParams = <T extends Record<string, string | undefined>>(): T => {
  const params = nextUseParams();
  return (params ?? {}) as unknown as T;
};
