export type ProjectCriteria = {
  skills: string[];
  commitment: string;
  location: string;
  keywords: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  criteria: ProjectCriteria;
  savedPersonIds: string[];
  passedPersonIds: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResumeMeta = {
  name: string;
  size: number;
  uploadedAt: string;
};

export type ReviewStatus = "draft" | "pending" | "accepted" | "rejected";

export type CandidateProfile = {
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  commitment: string;
  isOpenToWork: boolean;
};

export type Profile = {
  linkedinUrl: string;
  resume: ResumeMeta | null;
  reviewStatus: ReviewStatus;
  reviewReason: string | null;
  fullName: string;
  avatarPath: string | null;
  candidate: CandidateProfile;
};

export type Candidate = {
  userId: string;
  fullName: string;
  linkedinUrl: string;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  commitment: string;
  resumeName: string | null;
  resumePath: string | null;
  avatarPath: string | null;
};

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type IncomingApplication = {
  id: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  candidate: Candidate;
};

export type OutgoingApplication = {
  id: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  founderFullName: string | null;
  founderLinkedin: string | null;
};

export type NotificationType =
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "profile_accepted"
  | "profile_rejected"
  | "founder_outreach";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type PublicProject = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  criteria: ProjectCriteria;
  createdAt: string;
  founderFullName: string;
  founderHeadline: string;
  founderAvatarPath: string | null;
};

export const emptyCriteria = (): ProjectCriteria => ({
  skills: [],
  commitment: "",
  location: "",
  keywords: "",
});

export const emptyCandidate = (): CandidateProfile => ({
  headline: "",
  bio: "",
  skills: [],
  location: "",
  commitment: "",
  isOpenToWork: false,
});

export const emptyProfile = (): Profile => ({
  linkedinUrl: "",
  resume: null,
  reviewStatus: "draft",
  reviewReason: null,
  fullName: "",
  avatarPath: null,
  candidate: emptyCandidate(),
});

export const CANDIDATE_BIO_MIN = 60;
export const CANDIDATE_SKILLS_MIN = 2;

export type CandidateGap =
  | "headline"
  | "bio"
  | "skills"
  | "location"
  | "commitment";

export const candidateGaps = (c: CandidateProfile): CandidateGap[] => {
  const gaps: CandidateGap[] = [];
  if (!c.headline.trim()) gaps.push("headline");
  if (c.bio.trim().length < CANDIDATE_BIO_MIN) gaps.push("bio");
  if (c.skills.length < CANDIDATE_SKILLS_MIN) gaps.push("skills");
  if (!c.location.trim()) gaps.push("location");
  if (!c.commitment.trim()) gaps.push("commitment");
  return gaps;
};

export const isCandidateProfileComplete = (c: CandidateProfile): boolean =>
  candidateGaps(c).length === 0;
