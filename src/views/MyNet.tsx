"use client";
import { useEffect, useMemo, useState } from "react";
import {
 ArrowLeft,
 ArrowRight,
 Hammer,
 Hourglass,
 Loader2,
 Plus,
 Search,
 Telescope,
 XCircle,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { Footer } from "@/components/netstart/Footer";
import { AuthGate } from "@/components/netstart/AuthGate";
import { AppLayout } from "@/components/netstart/AppLayout";
import { StepCredentials } from "@/components/mockups/Steps";
import { OnboardingTour } from "@/components/netstart/OnboardingTour";
import { trackMynetSubmitted } from "@/lib/analytics";
import { Sidebar } from "@/components/netstart/Sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// Sidebar mounts on every render; CSS hides it under 768px so on
// mobile the bottom nav (rendered below) takes over. The
// `SHOW_SIDEBAR = !PROD` gate this used to carry was deleted when
// the app became publicly accessible "” sidebar is just the
// desktop chrome now.

import { MobileBottomNav } from "@/components/netstart/MobileBottomNav";
import { ProfileCard } from "@/components/mynet/ProfileCard";
import { CandidateCard } from "@/components/mynet/CandidateCard";
import { ProjectCard } from "@/components/mynet/ProjectCard";
import { ProjectDialog } from "@/components/mynet/ProjectDialog";
import { FindPeopleSheet } from "@/components/mynet/FindPeopleSheet";
import { SavedPeopleList } from "@/components/mynet/SavedPeopleList";
import { ApplicationsPanel } from "@/components/mynet/ApplicationsPanel";
import { MyNetWizard } from "@/components/mynet/MyNetWizard";
import { MyNetDashboard } from "@/components/mynet/MyNetDashboard";
import { getSupabase } from "@/lib/supabase";
import type { Role } from "@/components/netstart/RoleSwitcher";

import {
 createProject,
 deleteProject,
 getProfile,
 getProofPath,
 getResumePath,
 listProjects,
 removeAvatar,
 removePerson,
 removeProof,
 removeResume,
 setActiveProject,
 setLinkedIn,
 setOpenToWork,
 setPersonStatus,
 setProjectLifecycle,
 setProjectPublished,
 setWebsite,
 submitProfile,
 updateCandidate,
 updateProject,
 uploadAvatar,
 uploadProof,
 uploadResume,
} from "@/lib/mynet-storage";
import type { ProfileSubmission } from "@/components/mynet/ProfileCard";
import {
 emptyProfile,
 type CandidateProfile,
 type Profile,
 type Project,
 type ProjectCriteria,
 type ProjectLifecycle,
} from "@/lib/mynet-types";

const SAMPLE_PROJECTS: Project[] = [
 {
 id: "sample",
 title: "AI infra for logistics",
 description:
 "Pre-seed venture matching with a senior backend engineer. Sign in to define what you're building and who you want next to you.",
 criteria: {
 skills: ["Distributed systems", "Rust", "B2B GTM"],
 commitment: "Full-time",
 location: "Remote · NA / EU",
 keywords: "infra, logistics, ex-faang",
 },
 savedPersonIds: [],
 passedPersonIds: [],
 isPublished: false,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 },
];

// Supabase throws PostgrestError objects that aren't `instanceof
// Error`, so a naive Error-check here masks every database failure
// behind a generic "Something went wrong." Fall through to anything
// that has a string `.message`, then `.details`, then `.hint`, so
// users (and we, in toast logs) actually see what the DB said.
const errorMessage = (err: unknown): string => {
 if (err instanceof Error) return err.message;
 if (err && typeof err === "object") {
 const e = err as {
 message?: unknown;
 details?: unknown;
 hint?: unknown;
 code?: unknown;
 };
 if (typeof e.message === "string" && e.message.length > 0) {
 const code = typeof e.code === "string" ? ` (${e.code})` : "";
 return `${e.message}${code}`;
 }
 if (typeof e.details === "string" && e.details.length > 0) return e.details;
 if (typeof e.hint === "string" && e.hint.length > 0) return e.hint;
 }
 return "Something went wrong.";
};

const MyNet = () => {
 // Intro gate: every visit to /mynet starts on a brief explainer
 // screen with a CTA. Clicking it flips this to true and renders
 // the real page (which still shows AuthGate when not signed in).
 const [opened, setOpened] = useState(false);
 const { user, loading } = useAuth();
 const uid = user?.id ?? null;

 const [profile, setProfile] = useState<Profile>(emptyProfile());
 const [projects, setProjects] = useState<Project[]>([]);
 const [loadingData, setLoadingData] = useState(false);

 const [openProjectId, setOpenProjectId] = useState<string | null>(null);
 const [dialogState, setDialogState] = useState<
 | { mode: "closed" }
 | { mode: "new" }
 | { mode: "edit"; project: Project }
 >({ mode: "closed" });
 const [findForId, setFindForId] = useState<string | null>(null);
 const [editingPending, setEditingPending] = useState(false);

 const refreshAll = async () => {
 if (!uid) return;
 try {
 const [p, pr] = await Promise.all([getProfile(uid), listProjects(uid)]);
 setProfile(p);
 setProjects(pr);
 } catch (err) {
 toast.error(errorMessage(err));
 }
 };

 useEffect(() => {
 if (!uid) {
 setProfile(emptyProfile());
 setProjects([]);
 return;
 }
 let cancelled = false;
 setLoadingData(true);
 Promise.all([getProfile(uid), listProjects(uid)])
 .then(([p, pr]) => {
 if (cancelled) return;
 setProfile(p);
 setProjects(pr);
 })
 .catch((err) => {
 if (cancelled) return;
 toast.error(errorMessage(err));
 })
 .finally(() => {
 if (!cancelled) setLoadingData(false);
 });
 return () => {
 cancelled = true;
 };
 }, [uid]);

 const handleSaveCandidate = async (data: {
 candidate: CandidateProfile;
 fullName: string;
 }) => {
 if (!uid) return;
 await updateCandidate(uid, data.candidate, data.fullName);
 setProfile((prev) => ({
 ...prev,
 fullName: data.fullName,
 candidate: data.candidate,
 }));
 };

 const handleToggleOpenToWork = async (value: boolean) => {
 if (!uid) return;
 await setOpenToWork(uid, value);
 setProfile((prev) => ({
 ...prev,
 candidate: { ...prev.candidate, isOpenToWork: value },
 }));
 };

 const handleUploadAvatar = async (file: File) => {
 if (!uid) return;
 const newPath = await uploadAvatar(uid, file, profile.avatarPath);
 setProfile((prev) => ({ ...prev, avatarPath: newPath }));
 };

 const handleRemoveAvatar = async () => {
 if (!uid) return;
 await removeAvatar(uid, profile.avatarPath);
 setProfile((prev) => ({ ...prev, avatarPath: null }));
 };

 const handleTogglePublish = async (project: Project) => {
 const next = !project.isPublished;
 const snapshot = projects;
 setProjects((prev) =>
 prev.map((p) => (p.id === project.id ? { ...p, isPublished: next } : p)),
 );
 try {
 await setProjectPublished(project.id, next);
 toast.success(next ? "Project published." : "Project unpublished.");
 } catch (err) {
 setProjects(snapshot);
 toast.error(errorMessage(err));
 }
 };

 const handleSetLifecycle = async (
 project: Project,
 next: ProjectLifecycle,
 ) => {
 if (next === project.lifecycleState) return;
 const snapshot = projects;
 setProjects((prev) =>
 prev.map((p) =>
 p.id === project.id ? { ...p, lifecycleState: next } : p,
 ),
 );
 try {
 await setProjectLifecycle(project.id, next);
 toast.success(
 next === "active"
 ? "Project marked active."
 : next === "paused"
 ? "Project paused."
 : next === "filled"
 ? "Project marked filled."
 : "Project closed.",
 );
 } catch (err) {
 setProjects(snapshot);
 toast.error(errorMessage(err));
 }
 };

 const handleSubmitProfile = async (changes: ProfileSubmission) => {
 if (!uid) return;
 try {
 if (changes.linkedin !== undefined) {
 await setLinkedIn(uid, changes.linkedin);
 }
 if (changes.file) {
 const previousPath = await getResumePath(uid);
 await uploadResume(uid, changes.file, previousPath);
 } else if (changes.removeResume) {
 const previousPath = await getResumePath(uid);
 await removeResume(uid, previousPath);
 }
 if (changes.website !== undefined) {
 await setWebsite(uid, changes.website);
 }
 if (changes.proofFile) {
 const previousPath = await getProofPath(uid);
 await uploadProof(uid, changes.proofFile, previousPath);
 } else if (changes.removeProof) {
 const previousPath = await getProofPath(uid);
 await removeProof(uid, previousPath);
 }
 // submit_profile() is a no-op for accepted users (it only flips
 // draft/rejected -> pending), so this stays a single call site.
 await submitProfile();
 const fresh = await getProfile(uid);
 setProfile(fresh);
 // Fire mynet_submitted whenever the profile transitions INTO
 // the pending state from a non-pending one. Covers:
 // - first-time submit (draft -> pending)
 // - resubmission after admin rejection (rejected -> pending)
 // Edits to an already-accepted profile (accepted -> accepted)
 // don't fire so the funnel reads "actual reviewable submissions"
 // rather than "any time the user clicks Save."
 const previousStatus = profile.reviewStatus;
 const transitionedIntoPending =
 fresh.reviewStatus === "pending" && previousStatus !== "pending";
 toast.success(
 fresh.reviewStatus === "pending"
 ? "Submitted for review."
 : "Profile updated.",
 );
 if (transitionedIntoPending) {
 const role =
 (user?.user_metadata?.role as "founder" | "partner" | undefined) ??
 "partner";
 trackMynetSubmitted(role);
 }
 } catch (err) {
 toast.error(errorMessage(err));
 throw err;
 }
 };

 // Refresh after a role flip so the auth user object (and therefore
 // the dashboard's UI mode) reflects the new role on the next render.
 const handleRoleSwitched = async () => {
 try {
 // Force a session refresh so user_metadata.role lands locally.
 await getSupabase().auth.refreshSession();
 await refreshAll();
 } catch {
 // ignore "” onAuthStateChange usually fires on its own
 }
 };

 const handleSetActiveProject = async (projectId: string | null) => {
 if (!uid) return;
 const previous = profile.activeProjectId;
 // Optimistic update "” flip the star immediately, revert on error.
 setProfile((p) => ({ ...p, activeProjectId: projectId }));
 try {
 await setActiveProject(uid, projectId);
 toast.success(projectId ? "Set as Match focus." : "Cleared focus.");
 } catch (err) {
 setProfile((p) => ({ ...p, activeProjectId: previous }));
 toast.error(errorMessage(err));
 }
 };

 const handleCreateProject = async (data: {
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType: string;
 }) => {
 if (!uid) return;
 try {
 const project = await createProject(uid, data);
 setProjects((prev) => [project, ...prev]);
 toast.success("Project created.");
 } catch (err) {
 toast.error(errorMessage(err));
 throw err;
 }
 };

 const handleEditProject =
 (project: Project) =>
 async (data: {
 title: string;
 description: string;
 criteria: ProjectCriteria;
 businessType: string;
 }) => {
 try {
 await updateProject(project.id, data);
 setProjects((prev) =>
 prev.map((p) =>
 p.id === project.id
 ? {
 ...p,
 title: data.title,
 description: data.description,
 criteria: data.criteria,
 businessType: data.businessType,
 updatedAt: new Date().toISOString(),
 }
 : p,
 ),
 );
 toast.success("Project updated.");
 } catch (err) {
 toast.error(errorMessage(err));
 throw err;
 }
 };

 const handleDeleteProject = async (project: Project) => {
 if (!confirm(`Delete "${project.title}"? This can't be undone.`)) return;
 const snapshot = projects;
 setProjects((prev) => prev.filter((p) => p.id !== project.id));
 if (openProjectId === project.id) setOpenProjectId(null);
 try {
 await deleteProject(project.id);
 } catch (err) {
 setProjects(snapshot);
 toast.error(errorMessage(err));
 }
 };

 const handleSavePerson = async (projectId: string, personId: string) => {
 const project = projects.find((p) => p.id === projectId);
 if (!project) return;
 const isSaved = project.savedPersonIds.includes(personId);
 const snapshot = projects;

 setProjects((prev) =>
 prev.map((p) =>
 p.id === projectId
 ? {
 ...p,
 savedPersonIds: isSaved
 ? p.savedPersonIds.filter((id) => id !== personId)
 : [...p.savedPersonIds, personId],
 passedPersonIds: p.passedPersonIds.filter((id) => id !== personId),
 updatedAt: new Date().toISOString(),
 }
 : p,
 ),
 );

 try {
 if (isSaved) {
 await removePerson(projectId, personId);
 } else {
 await setPersonStatus(projectId, personId, "saved");
 }
 toast.success(isSaved ? "Removed from saved." : "Saved to project.");
 } catch (err) {
 setProjects(snapshot);
 toast.error(errorMessage(err));
 }
 };

 const handlePassPerson = async (projectId: string, personId: string) => {
 const project = projects.find((p) => p.id === projectId);
 if (!project) return;
 const isPassed = project.passedPersonIds.includes(personId);
 const snapshot = projects;

 setProjects((prev) =>
 prev.map((p) =>
 p.id === projectId
 ? {
 ...p,
 passedPersonIds: isPassed
 ? p.passedPersonIds.filter((id) => id !== personId)
 : [...p.passedPersonIds, personId],
 savedPersonIds: p.savedPersonIds.filter((id) => id !== personId),
 updatedAt: new Date().toISOString(),
 }
 : p,
 ),
 );

 try {
 if (isPassed) {
 await removePerson(projectId, personId);
 } else {
 await setPersonStatus(projectId, personId, "passed");
 }
 } catch (err) {
 setProjects(snapshot);
 toast.error(errorMessage(err));
 }
 };

 const openProject = useMemo(
 () => projects.find((p) => p.id === openProjectId) ?? null,
 [projects, openProjectId],
 );

 const findProject = useMemo(
 () => projects.find((p) => p.id === findForId) ?? null,
 [projects, findForId],
 );

 const isAuthed = Boolean(user) && !loading;
 const displayProjects = isAuthed ? projects : SAMPLE_PROJECTS;
 const displayProfile = isAuthed ? profile : emptyProfile();

 // Pre-acceptance flow: draft/rejected users go through the step-by-step wizard.
 // Pending and accepted users both see the full dashboard (the dashboard
 // surfaces a "review pending" pill for pending users so they understand state
 // without being blocked from viewing all of their MyNet).
 const showWizard =
 isAuthed &&
 (profile.reviewStatus === "draft" ||
 profile.reviewStatus === "rejected" ||
 (profile.reviewStatus === "pending" && editingPending));
 const showDashboard =
 isAuthed &&
 (profile.reviewStatus === "accepted" ||
 profile.reviewStatus === "pending");

 if (!opened) {
 // MyNet intro: split layout. Text on the left, the same
 // Credentials phone mockup we use on /how on the right.
 return (
 <AppLayout>
 <div className="container py-12 md:py-16">
 <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
 <div>
 <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1] mb-6 font-bold">
 Your network,
 <br />
 your moves.
 </h1>
 <div className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 space-y-4">
 <p>
 MyNet is your private workspace on Polln8. Your profile,
 your credentials, your projects, and the switch that
 decides whether you&apos;re discoverable to the other
 side of the network.
 </p>
 <p>
 Nothing here goes public until you publish a project or
 flip Open to Work. Edit at your own pace; we&apos;ll
 only show founders what you&apos;ve approved.
 </p>
 </div>
 <Button
 variant="gold"
 size="xl"
 onClick={() => setOpened(true)}
 className="group"
 >
 Open MyNet
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </Button>
 </div>
 <div className="relative w-full max-w-full overflow-hidden">
 <div className="relative left-1/2 w-fit -translate-x-1/2">
 <StepCredentials />
 </div>
 </div>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-16 max-w-5xl">
 {[
 { t: "Profile + credentials", b: "LinkedIn, resume or proof of work, and the candidate fields founders rank against." },
 { t: "Projects", b: "Founders post what they're building. Publish to enter the deck; unpublish anytime." },
 { t: "Open to Work", b: "Partners flip the switch when they want founders to see them. Off by default." },
 { t: "Find People", b: "Run a focused search against a specific project's criteria." },
 ].map((d) => (
 <div
 key={d.t}
 className="rounded-sm border border-border bg-card p-4"
 >
 <h3 className="font-display text-base mb-1.5 font-semibold">{d.t}</h3>
 <p className="text-xs text-muted-foreground leading-relaxed">{d.b}</p>
 </div>
 ))}
 </div>
 </div>
 </AppLayout>
 );
 }

 if (showWizard && uid) {
 return (
 <div className="min-h-dvh bg-background text-foreground">
 <Sidebar />
 <div
 className="transition-[padding] duration-200 ease-out"
 style={{ paddingLeft: "var(--sidebar-width, 0px)" }}
 >
 <main className="pt-12 pb-24">
 <MyNetWizard
 uid={uid}
 profile={profile}
 onProfileRefresh={refreshAll}
 onSubmitComplete={() => setEditingPending(false)}
 preselectedRole={(() => {
 const r = user?.user_metadata?.role;
 return r === "founder" || r === "partner" ? r : undefined;
 })()}
 />
 </main>
 <Footer />
 </div>
 <MobileBottomNav />
 </div>
 );
 }


 return (
 <div className="min-h-dvh bg-background text-foreground">
 <Sidebar />
 <div style={{ paddingLeft: "var(--sidebar-width, 0px)" }}>
 <main
 className={`pt-12 pb-24 ${
 !isAuthed ? "pointer-events-none select-none " : ""
 }`}
 >
 <div className="container">
 {openProject && isAuthed ? (
 <>
 <button
 onClick={() => setOpenProjectId(null)}
 className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 <ArrowLeft className="h-4 w-4" />
 <span className="font-mono uppercase tracking-widest text-xs">
 All projects
 </span>
 </button>

 <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Project
 </p>
 <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
 {openProject.title}
 </h1>
 {openProject.description && (
 <p className="text-muted-foreground max-w-2xl">
 {openProject.description}
 </p>
 )}
 </div>

 <div className="flex gap-2 flex-wrap">
 <Button
 variant="outlineGold"
 size="lg"
 onClick={() =>
 setDialogState({ mode: "edit", project: openProject })
 }
 >
 Edit criteria
 </Button>
 <Button
 variant="gold"
 size="lg"
 onClick={() => setFindForId(openProject.id)}
 >
 <Search className="h-4 w-4" />
 Find people
 </Button>
 </div>
 </div>

 <CriteriaSummary project={openProject} />

 <div className="mt-12">
 <div className="flex items-center justify-between mb-6">
 <h2 className="font-display text-2xl">
 Saved people{" "}
 <span className="text-muted-foreground">
 ({openProject.savedPersonIds.length})
 </span>
 </h2>
 </div>
 <SavedPeopleList
 project={openProject}
 onUnsave={(personId) =>
 handleSavePerson(openProject.id, personId)
 }
 />
 </div>
 </>
 ) : showDashboard ? (
 <MyNetDashboard
 profile={profile}
 projects={projects}
 onSubmitProfile={handleSubmitProfile}
 onSaveCandidate={handleSaveCandidate}
 onToggleOpenToWork={handleToggleOpenToWork}
 onUploadAvatar={handleUploadAvatar}
 onRemoveAvatar={handleRemoveAvatar}
 onNewProject={() => setDialogState({ mode: "new" })}
 onOpenProject={(id) => setOpenProjectId(id)}
 onEditProject={(p) => setDialogState({ mode: "edit", project: p })}
 onDeleteProject={handleDeleteProject}
 onFindPeople={(id) => setFindForId(id)}
 onTogglePublish={handleTogglePublish}
 onSetLifecycle={handleSetLifecycle}
 onSetActiveProject={handleSetActiveProject}
 role={(() => {
 const r = user?.user_metadata?.role;
 // Default to partner for legacy users with no role
 // stamp; the founder side requires a deliberate flip.
 return r === "founder" ? "founder" : "partner";
 })() as Role}
 onRoleSwitched={handleRoleSwitched}
 />
 ) : (
 <>
 <header className="mb-12">
 <h1 className="font-display text-3xl sm:text-4xl md:text-6xl leading-[1] mb-4">
 Your network,<br />
 <em className="text-gradient-gold not-italic">your moves.</em>
 </h1>
 <p className="text-muted-foreground max-w-xl">
 Manage your credentials, run searches by project, and save the
 partners worth talking to.
 </p>
 </header>

 <section className="mb-12">
 <ProfileCard
 profile={displayProfile}
 role="partner"
 onSubmit={handleSubmitProfile}
 />
 </section>

 {isAuthed ? (
 <Tabs defaultValue="building" className="w-full">
 <TabsList className="grid grid-cols-2 w-full max-w-md mb-8 bg-background border border-border h-12 p-1">
 <TabsTrigger value="building" className="gap-2 text-sm">
 <Hammer className="h-4 w-4" />
 I'm building
 </TabsTrigger>
 <TabsTrigger value="looking" className="gap-2 text-sm">
 <Telescope className="h-4 w-4" />
 I'm looking
 </TabsTrigger>
 </TabsList>

 <TabsContent value="looking" className="space-y-12">
 <CandidateCard
 profile={displayProfile}
 onSave={handleSaveCandidate}
 onUploadAvatar={handleUploadAvatar}
 onRemoveAvatar={handleRemoveAvatar}
 />

 {displayProfile.reviewStatus === "accepted" && (
 <Link
 to="/match"
 className="block rounded-sm border border-gold bg-card p-6 hover:border-gold transition-colors group"
 >
 <div className="flex items-center justify-between gap-4">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-1">
 Find projects
 </p>
 <h3 className="font-display text-2xl mb-1">
 Open the Match deck
 </h3>
 <p className="text-sm text-muted-foreground">
 Swipe through open projects ranked against your
 profile.
 </p>
 </div>
 <ArrowRight className="h-6 w-6 text-gold group-hover:translate-x-1 transition-transform flex-shrink-0" />
 </div>
 </Link>
 )}

 <ApplicationsPanel
 ownedProjects={projects}
 mode="sent"
 />
 </TabsContent>

 <TabsContent value="building" className="space-y-12">
 <section className="relative">
 <div
 className={
 displayProfile.reviewStatus === "accepted"
 ? ""
 : "pointer-events-none select-none "
 }
 >
 <div className="flex items-center justify-between mb-6">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 Projects
 </p>
 <h2 className="font-display text-3xl">
 What you're building
 </h2>
 </div>
 <Button
 variant="gold"
 size="lg"
 onClick={() => setDialogState({ mode: "new" })}
 disabled={
 displayProfile.reviewStatus !== "accepted"
 }
 >
 <Plus className="h-4 w-4" />
 New project
 </Button>
 </div>

 {isAuthed && loadingData ? (
 <div className="rounded-sm border border-border bg-card p-12 text-center">
 <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
 <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 Loading your projects...
 </p>
 </div>
 ) : displayProjects.length === 0 ? (
 <div className="rounded-sm border border-dashed border-border bg-card p-12 text-center">
 <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">
 Empty
 </p>
 <h3 className="font-display text-2xl mb-3">
 No projects yet.
 </h3>
 <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
 A project is what you're building plus the criteria for
 who you want next to you. Set one up and run Find People.
 </p>
 <Button
 variant="gold"
 size="lg"
 onClick={() => setDialogState({ mode: "new" })}
 disabled={displayProfile.reviewStatus !== "accepted"}
 >
 <Plus className="h-4 w-4" />
 Create your first project
 </Button>
 </div>
 ) : (
 <div className="grid md:grid-cols-2 gap-4">
 {displayProjects.map((p) => (
 <ProjectCard
 key={p.id}
 project={p}
 onOpen={() => setOpenProjectId(p.id)}
 onEdit={() =>
 setDialogState({ mode: "edit", project: p })
 }
 onDelete={() => handleDeleteProject(p)}
 onFindPeople={() => setFindForId(p.id)}
 onTogglePublish={() => handleTogglePublish(p)}
 />
 ))}
 </div>
 )}
 </div>

 {isAuthed && displayProfile.reviewStatus !== "accepted" && (
 <div className="absolute inset-0 flex items-center justify-center p-6">
 {displayProfile.reviewStatus === "rejected" ? (
 <div className="max-w-md w-full rounded-sm border border-destructive bg-card shadow-2xl p-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-destructive bg-destructive mb-4">
 <XCircle className="h-5 w-5 text-destructive" />
 </div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-destructive mb-3">
 Submission rejected
 </p>
 <h3 className="font-display text-2xl mb-3">
 Not a fit yet.
 </h3>
 {displayProfile.reviewReason && (
 <div className="rounded-sm border border-border bg-background p-4 mb-4 text-left">
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
 Reviewer note
 </p>
 <p className="text-sm leading-relaxed">
 {displayProfile.reviewReason}
 </p>
 </div>
 )}
 <p className="text-sm text-muted-foreground">
 Update your resume or LinkedIn above and resubmit.
 </p>
 </div>
 ) : displayProfile.reviewStatus === "draft" ? (
 <div className="max-w-md w-full rounded-sm border border-gold bg-card shadow-2xl p-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gold mb-4">
 <Hourglass className="h-5 w-5 text-white" />
 </div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Profile not submitted
 </p>
 <h3 className="font-display text-2xl mb-3">
 Submit your credentials.
 </h3>
 <p className="text-sm text-muted-foreground">
 Add your LinkedIn or resume above and click Submit for
 review to unlock projects.
 </p>
 </div>
 ) : (
 <div className="max-w-md w-full rounded-sm border border-gold bg-card shadow-2xl p-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold bg-gold mb-4">
 <Hourglass className="h-5 w-5 text-white" />
 </div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Review pending
 </p>
 <h3 className="font-display text-2xl mb-3">
 Hold tight.
 </h3>
 <p className="text-sm text-muted-foreground">
 Your submission is in the queue. We'll review your
 resume or LinkedIn shortly.
 </p>
 </div>
 )}
 </div>
 )}
 </section>

 <ApplicationsPanel
 ownedProjects={projects}
 mode="received"
 />
 </TabsContent>
 </Tabs>
 ) : (
 <section className="relative">
 <div className="pointer-events-none select-none ">
 <div className="flex items-center justify-between mb-6">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 Projects
 </p>
 <h2 className="font-display text-3xl">
 What you're building
 </h2>
 </div>
 <Button variant="gold" size="lg" disabled>
 <Plus className="h-4 w-4" />
 New project
 </Button>
 </div>
 <div className="grid md:grid-cols-2 gap-4">
 {SAMPLE_PROJECTS.map((p) => (
 <ProjectCard
 key={p.id}
 project={p}
 onOpen={() => undefined}
 onEdit={() => undefined}
 onDelete={() => undefined}
 onFindPeople={() => undefined}
 onTogglePublish={() => undefined}
 />
 ))}
 </div>
 </div>
 </section>
 )}
 </>
 )}
 </div>
 </main>
 </div>

 {!loading && !user && <AuthGate />}

 {/* First-visit 3-step coach-mark overlay. Keyed per-user via
 localStorage so it pops exactly once per account. Skips
 itself on logged-out / hydrating states. */}
 {user && <OnboardingTour userId={user.id} />}

 <Footer />

 {isAuthed && dialogState.mode !== "closed" && (
 <ProjectDialog
 open
 onOpenChange={(open) => {
 if (!open) setDialogState({ mode: "closed" });
 }}
 initial={dialogState.mode === "edit" ? dialogState.project : undefined}
 onSubmit={
 dialogState.mode === "edit"
 ? handleEditProject(dialogState.project)
 : handleCreateProject
 }
 />
 )}

 {isAuthed && (
 <FindPeopleSheet
 open={Boolean(findProject)}
 onOpenChange={(open) => {
 if (!open) setFindForId(null);
 }}
 project={findProject}
 onSave={(personId) =>
 findProject && handleSavePerson(findProject.id, personId)
 }
 onPass={(personId) =>
 findProject && handlePassPerson(findProject.id, personId)
 }
 />
 )}
 <MobileBottomNav />
 </div>
 );
};

const CriteriaSummary = ({ project }: { project: Project }) => {
 const { skills, commitment, location, keywords } = project.criteria;
 const hasAny =
 skills.length > 0 ||
 commitment.trim() !== "" ||
 location.trim() !== "" ||
 keywords.trim() !== "";

 if (!hasAny) {
 return (
 <div className="rounded-sm border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
 No criteria set. Tap Edit criteria to define who you're looking for.
 </div>
 );
 }

 return (
 <div className="rounded-sm border border-border bg-card p-6">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-4">
 Criteria
 </p>
 <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
 {skills.length > 0 && (
 <div className="sm:col-span-2">
 <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
 Skills
 </dt>
 <dd className="flex flex-wrap gap-1.5">
 {skills.map((s) => (
 <span
 key={s}
 className="px-2.5 py-1 text-xs border border-gold bg-gold rounded-sm"
 >
 {s}
 </span>
 ))}
 </dd>
 </div>
 )}
 {commitment && <Field label="Commitment" value={commitment} />}
 {location && <Field label="Location" value={location} />}
 {keywords && (
 <div className="sm:col-span-2">
 <Field label="Keywords" value={keywords} />
 </div>
 )}
 </dl>
 </div>
 );
};

const Field = ({ label, value }: { label: string; value: string }) => (
 <div>
 <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
 {label}
 </dt>
 <dd className="text-sm">{value}</dd>
 </div>
);

export default MyNet;
