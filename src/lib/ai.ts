// Gemini text-embedding-004 (768-dim) free-tier client.
// Set VITE_GEMINI_API_KEY in .env.local and on Vercel.
// Server-side embedding storage + cosine search lives in pg_vector.

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? "";
const EMBEDDING_MODEL = "text-embedding-004";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
const MAX_INPUT_CHARS = 8000;

export const isAiConfigured = (): boolean => GEMINI_API_KEY.length > 0;

export const embedText = async (text: string): Promise<number[] | null> => {
  if (!isAiConfigured()) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const res = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: trimmed.slice(0, MAX_INPUT_CHARS) }] },
      }),
    });
    if (!res.ok) {
      console.warn("Gemini embed failed", res.status);
      return null;
    }
    const data = (await res.json()) as { embedding?: { values: number[] } };
    return data.embedding?.values ?? null;
  } catch (err) {
    console.warn("Gemini embed error", err);
    return null;
  }
};

export const formatVector = (v: number[]): string => `[${v.join(",")}]`;

export const embedCandidateText = (data: {
  fullName: string;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  commitment: string;
}): string =>
  [
    data.fullName ? `Name: ${data.fullName}` : "",
    data.headline ? `Role: ${data.headline}` : "",
    data.bio ? `About: ${data.bio}` : "",
    data.skills.length > 0 ? `Skills: ${data.skills.join(", ")}` : "",
    data.location ? `Location: ${data.location}` : "",
    data.commitment ? `Commitment: ${data.commitment}` : "",
  ]
    .filter(Boolean)
    .join("\n");

export const embedProjectText = (data: {
  title: string;
  description: string;
  criteria: {
    skills: string[];
    commitment: string;
    location: string;
    keywords: string;
  };
}): string =>
  [
    `Project: ${data.title}`,
    data.description ? `About: ${data.description}` : "",
    data.criteria.skills.length > 0
      ? `Looking for: ${data.criteria.skills.join(", ")}`
      : "",
    data.criteria.commitment ? `Commitment: ${data.criteria.commitment}` : "",
    data.criteria.location ? `Location: ${data.criteria.location}` : "",
    data.criteria.keywords ? `Keywords: ${data.criteria.keywords}` : "",
  ]
    .filter(Boolean)
    .join("\n");
