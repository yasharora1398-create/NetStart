// Mobile-side types. Mirror of src/lib/mynet-types.ts on web.
// Eventually move to packages/core when we extract.

export type ReviewStatus = "draft" | "pending" | "accepted" | "rejected";

export type ResumeMeta = {
  name: string;
  size: number;
  uploadedAt: string;
};

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

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

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
