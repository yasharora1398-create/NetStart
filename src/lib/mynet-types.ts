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
};

export type PublicProject = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  criteria: ProjectCriteria;
  createdAt: string;
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
  candidate: emptyCandidate(),
});
