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
  createdAt: string;
  updatedAt: string;
};

export type ResumeMeta = {
  name: string;
  size: number;
  uploadedAt: string;
};

export type Profile = {
  linkedinUrl: string;
  resume: ResumeMeta | null;
};

export const emptyCriteria = (): ProjectCriteria => ({
  skills: [],
  commitment: "",
  location: "",
  keywords: "",
});

export const emptyProfile = (): Profile => ({
  linkedinUrl: "",
  resume: null,
});
