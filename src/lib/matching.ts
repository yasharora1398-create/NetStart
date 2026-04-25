import type { Builder } from "./builders";
import type { Candidate, ProjectCriteria } from "./mynet-types";

export type MatchResult = {
  builder: Builder;
  score: number;
  matchedSkills: string[];
};

export type CandidateMatchResult = {
  candidate: Candidate;
  score: number;
  matchedSkills: string[];
};

const norm = (s: string) => s.trim().toLowerCase();

type Scorable = {
  skills: string[];
  commitment: string;
  location: string;
  haystack: string;
};

const score = (target: Scorable, criteria: ProjectCriteria) => {
  const targetSkills = target.skills.map(norm);
  const wantedSkills = criteria.skills.map(norm).filter(Boolean);
  const matched = wantedSkills.filter((w) =>
    targetSkills.some((ts) => ts.includes(w) || w.includes(ts)),
  );

  let total = 0;
  if (wantedSkills.length > 0) {
    total += (matched.length / wantedSkills.length) * 60;
  }
  const commitment = norm(criteria.commitment);
  if (commitment && norm(target.commitment).includes(commitment)) total += 15;
  const location = norm(criteria.location);
  if (location && norm(target.location).includes(location)) total += 15;
  const keywords = norm(criteria.keywords);
  if (keywords) {
    const tokens = keywords.split(/\s+/).filter(Boolean);
    const hits = tokens.filter((t) => target.haystack.includes(t)).length;
    if (tokens.length > 0) total += (hits / tokens.length) * 10;
  }

  return {
    score: Math.round(total),
    matchedSkills: target.skills.filter((s) =>
      matched.some((m) => norm(s).includes(m) || m.includes(norm(s))),
    ),
  };
};

export const scoreMatch = (builder: Builder, criteria: ProjectCriteria): MatchResult => {
  const result = score(
    {
      skills: builder.skills,
      commitment: builder.commitment,
      location: builder.location,
      haystack:
        `${builder.role} ${builder.proof} ${builder.building}`.toLowerCase(),
    },
    criteria,
  );
  return { builder, score: result.score, matchedSkills: result.matchedSkills };
};

export const scoreCandidate = (
  candidate: Candidate,
  criteria: ProjectCriteria,
): CandidateMatchResult => {
  const result = score(
    {
      skills: candidate.skills,
      commitment: candidate.commitment,
      location: candidate.location,
      haystack: `${candidate.headline} ${candidate.bio}`.toLowerCase(),
    },
    criteria,
  );
  return { candidate, score: result.score, matchedSkills: result.matchedSkills };
};

export const hasAnyCriteria = (criteria: ProjectCriteria): boolean =>
  criteria.skills.length > 0 ||
  criteria.commitment.trim() !== "" ||
  criteria.location.trim() !== "" ||
  criteria.keywords.trim() !== "";
