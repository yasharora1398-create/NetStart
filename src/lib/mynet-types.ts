export type ProjectCriteria = {
 skills: string[];
 commitment: string;
 location: string;
 keywords: string;
};

export type ProjectLifecycle = "active" | "paused" | "filled" | "closed";

export type Project = {
 id: string;
 ownerId: string;
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType: string;
 lifecycleState: ProjectLifecycle;
 savedPersonIds: string[];
 passedPersonIds: string[];
 isPublished: boolean;
 createdAt: string;
 updatedAt: string;
 // True when the row was inserted via the admin 'Recommend a startup'
 // form. Used by the admin My-posts list to distinguish a curated
 // recommendation from a personal project.
 isPolln8Recommended: boolean;
 // Admin-supplied display fields - only populated when
 // isPolln8Recommended is true. Empty strings otherwise.
 polln8FounderName: string;
 polln8FounderHeadline: string;
 polln8FounderWebsite: string;
 // Admin-uploaded logo / founder photo for a recommendation. Path
 // into the 'avatars' bucket; resolve via getAvatarUrl. Empty when
 // no photo has been uploaded for the post.
 polln8FounderAvatarPath: string;
};

// NOTE: PublicProject.polln8FounderAvatarPath is `string | null`
// (defined further down) while Project.polln8FounderAvatarPath is
// `string` (always present, "" when empty) - keep both shapes in
// sync with their respective call sites.

export type ResumeMeta = {
 name: string;
 size: number;
 uploadedAt: string;
};

// Founder proof-of-work file. Same shape as ResumeMeta but tracked
// separately so a profile can carry both if the user switches roles.
export type ProofMeta = {
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
 // Founder fields. websiteUrl is what they're building; proof is a
 // file showing prior shipped work. Both empty for partners.
 websiteUrl: string;
 proof: ProofMeta | null;
 reviewStatus: ReviewStatus;
 reviewReason: string | null;
 fullName: string;
 avatarPath: string | null;
 // Founder's currently-focused project. Drives which project's
 // criteria Match uses to rank candidates and is where saves land.
 activeProjectId: string | null;
 candidate: CandidateProfile;
 // Banner image path (under the 'avatars' bucket, prefix
 // <uid>/banner/). Empty string = no banner uploaded; the public
 // profile renders a neutral placeholder.
 bannerImagePath: string;
 // Permanent verified perk (one-time 50c via Stripe). When true,
 // the user's Match card renders with the green outline +
 // "Recommended by Polln8" header strip, and a small blue
 // checkmark renders next to their name everywhere it appears.
 isVerified: boolean;
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
 | "founder_outreach"
 | "chat_request"
 | "review_request";

export type AppNotification = {
 id: string;
 type: NotificationType;
 title: string;
 body: string;
 link: string | null;
 fromUserId: string | null;
 readAt: string | null;
 createdAt: string;
};

export type ChatContact = {
 contactId: string;
 fullName: string;
 linkedinUrl: string;
 avatarPath: string | null;
 connectedAt: string;
};

export type PublicProject = {
 id: string;
 ownerId: string;
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType: string;
 lifecycleState: ProjectLifecycle;
 createdAt: string;
 founderFullName: string;
 founderHeadline: string;
 founderAvatarPath: string | null;
 // Polln8-curated card: admin posted this on behalf of someone else.
 // When true, the Match card renders with a green outline + a
 // 'Recommended by Polln8' badge and uses polln8FounderName /
 // polln8FounderHeadline in place of the owner's profile fields.
 isPolln8Recommended: boolean;
 polln8FounderName: string;
 polln8FounderHeadline: string;
 polln8FounderWebsite: string;
 // Path to the admin-uploaded founder photo for the recommendation;
 // resolve with getAvatarUrl. Null when none was uploaded - card
 // falls back to the silhouette icon.
 polln8FounderAvatarPath: string | null;
 // Paid boost: owner of this project has an active boost row in
 // public.boosts. Boosted cards get a green outline only (no ribbon
 // text) and sort to the top of the deck (most recent boost first).
 // The ribbon text is reserved for Polln8 recommendations and
 // verified-perk owners.
 isBoosted: boolean;
 // Verified perk: owner.is_verified = true. Cards from a verified
 // founder get the green outline + "Recommended by Polln8" header
 // strip (same treatment as a Polln8-curated card).
 isOwnerVerified: boolean;
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
 websiteUrl: "",
 proof: null,
 reviewStatus: "draft",
 reviewReason: null,
 fullName: "",
 avatarPath: null,
 activeProjectId: null,
 candidate: emptyCandidate(),
 bannerImagePath: "",
 isVerified: false,
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

export const candidateGapLabel = (
 gap: CandidateGap,
 c: CandidateProfile,
): string => {
 switch (gap) {
 case "headline":
 return "headline";
 case "bio": {
 const have = c.bio.trim().length;
 return `pitch/bio (${have}/${CANDIDATE_BIO_MIN} chars)`;
 }
 case "skills":
 return `${CANDIDATE_SKILLS_MIN - c.skills.length} more skill${
 CANDIDATE_SKILLS_MIN - c.skills.length === 1 ? "" : "s"
 }`;
 case "location":
 return "location";
 case "commitment":
 return "commitment";
 }
};

export const isCandidateProfileComplete = (c: CandidateProfile): boolean =>
 candidateGaps(c).length === 0;
