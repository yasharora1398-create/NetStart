import type { Builder } from "./builders";
import type { ProjectCriteria } from "./mynet-types";

export type MatchResult = {
  builder: Builder;
  score: number;
  matchedSkills: string[];
};

const norm = (s: string) => s.trim().toLowerCase();

export const scoreMatch = (builder: Builder, criteria: ProjectCriteria): MatchResult => {
  const builderSkills = builder.skills.map(norm);
  const wantedSkills = criteria.skills.map(norm).filter(Boolean);
  const matchedSkills = wantedSkills.filter((w) =>
    builderSkills.some((bs) => bs.includes(w) || w.includes(bs)),
  );

  let score = 0;
  if (wantedSkills.length > 0) {
    score += (matchedSkills.length / wantedSkills.length) * 60;
  }

  const commitment = norm(criteria.commitment);
  if (commitment && norm(builder.commitment).includes(commitment)) score += 15;

  const location = norm(criteria.location);
  if (location && norm(builder.location).includes(location)) score += 15;

  const keywords = norm(criteria.keywords);
  if (keywords) {
    const haystack = `${builder.role} ${builder.proof} ${builder.building}`.toLowerCase();
    const tokens = keywords.split(/\s+/).filter(Boolean);
    const hits = tokens.filter((t) => haystack.includes(t)).length;
    if (tokens.length > 0) score += (hits / tokens.length) * 10;
  }

  return {
    builder,
    score: Math.round(score),
    matchedSkills: builder.skills.filter((s) =>
      matchedSkills.some((m) => norm(s).includes(m) || m.includes(norm(s))),
    ),
  };
};

export const hasAnyCriteria = (criteria: ProjectCriteria): boolean =>
  criteria.skills.length > 0 ||
  criteria.commitment.trim() !== "" ||
  criteria.location.trim() !== "" ||
  criteria.keywords.trim() !== "";
