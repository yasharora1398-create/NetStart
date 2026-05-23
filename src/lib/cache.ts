/**
 * Tiny typed localStorage helpers for stale-while-revalidate caching.
 *
 * Pattern in consumer code:
 *
 * const [items, setItems] = useState<T[]>(() => readCache(key) ?? []);
 * useEffect(() => {
 * fetchFresh().then((fresh) => {
 * setItems(fresh);
 * writeCache(key, fresh);
 * });
 * }, []);
 *
 * Read returns null on parse error or absent key. Write swallows
 * quota / private-mode errors silently -- a cache miss is fine, a
 * thrown error in a side-effect path is not.
 */

export const readCache = <T>(key: string): T | null => {
 if (typeof window === "undefined") return null;
 try {
 const raw = window.localStorage.getItem(key);
 if (!raw) return null;
 return JSON.parse(raw) as T;
 } catch {
 return null;
 }
};

export const writeCache = <T>(key: string, value: T): void => {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.setItem(key, JSON.stringify(value));
 } catch {
 // ignore (quota, private mode)
 }
};
