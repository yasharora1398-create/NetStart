"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Loader2, Pencil, Star, User, X } from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { BackButton } from "@/components/netstart/BackButton";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { getAvatarUrl } from "@/lib/mynet-storage";
import {
 createReview,
 listReviews,
 type Review,
 type ReviewTargetRole,
} from "@/lib/reviews-storage";
import { cn } from "@/lib/utils";

const formatDate = (iso: string): string => {
 try {
 return new Date(iso).toLocaleDateString(undefined, {
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 } catch {
 return iso;
 }
};

const Reviews = () => {
 const { user, loading } = useAuth();
 const [tab, setTab] = useState<ReviewTargetRole>("partner");
 const [reviewsByRole, setReviewsByRole] = useState<
 Record<ReviewTargetRole, Review[] | null>
 >({ partner: null, founder: null });
 const [loadingList, setLoadingList] = useState(false);
 const [writerOpen, setWriterOpen] = useState(false);
 const [thanksOpen, setThanksOpen] = useState(false);

 // Re-fetch the active tab whenever it changes or a new review lands.
 useEffect(() => {
 let cancelled = false;
 setLoadingList(true);
 listReviews(tab)
 .then((list) => {
 if (!cancelled) {
 setReviewsByRole((prev) => ({ ...prev, [tab]: list }));
 }
 })
 .catch((err) => {
 if (!cancelled) {
 toast.error(err instanceof Error ? err.message : "Failed to load.");
 }
 })
 .finally(() => {
 if (!cancelled) setLoadingList(false);
 });
 return () => {
 cancelled = true;
 };
 }, [tab]);

 const handlePosted = async () => {
 setWriterOpen(false);
 setThanksOpen(true);
 // Refresh the active tab so the new review shows up at the top.
 try {
 const fresh = await listReviews(tab);
 setReviewsByRole((prev) => ({ ...prev, [tab]: fresh }));
 } catch {
 /* toast already fired during create */
 }
 };

 const handleWriteClick = () => {
 if (!user) {
 toast.error("Sign in to leave a review.");
 return;
 }
 setWriterOpen(true);
 };

 const current = reviewsByRole[tab];

 return (
 <AppLayout>
 <div className="container max-w-4xl py-6 md:py-10">
 <BackButton to="/" label="Back to home" />
 <header className="mb-6">
 <h1 className="font-display text-3xl sm:text-4xl leading-tight">
 Reviews
 </h1>
 <p className="mt-1 text-sm text-muted-foreground max-w-xl">
 Honest takes from people who&apos;ve built on Polln8. Pick the
 side you&apos;re curious about; sign in to leave your own.
 </p>
 </header>

 <Tabs
 value={tab}
 onValueChange={(v) => setTab(v as ReviewTargetRole)}
 className="w-full"
 >
 <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
 <TabsList>
 <TabsTrigger value="partner">Partner reviews</TabsTrigger>
 <TabsTrigger value="founder">Founder reviews</TabsTrigger>
 </TabsList>

 {user ? (
 <Button
 variant="gold"
 size="sm"
 onClick={handleWriteClick}
 >
 <Pencil className="h-4 w-4" />
 Write a review
 </Button>
 ) : (
 <Link to="/signin">
 <Button variant="outline" size="sm">
 <Pencil className="h-4 w-4" />
 Sign in to write
 </Button>
 </Link>
 )}
 </div>

 <TabsContent value="partner" className="mt-0">
 <ReviewList list={current} loading={loadingList} />
 </TabsContent>
 <TabsContent value="founder" className="mt-0">
 <ReviewList list={current} loading={loadingList} />
 </TabsContent>
 </Tabs>
 </div>

 <WriteReviewDialog
 open={writerOpen}
 onClose={() => setWriterOpen(false)}
 targetRole={tab}
 onPosted={handlePosted}
 />

 <ThanksDialog
 open={thanksOpen}
 onClose={() => setThanksOpen(false)}
 />

 {/* No AuthGate overlay - reviews are public. We just gate the
 write button on signed-in state. */}
 {loading ? null : null}
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Review list

const ReviewList = ({
 list,
 loading,
}: {
 list: Review[] | null;
 loading: boolean;
}) => {
 if (loading && list === null) {
 return (
 <div className="rounded-sm border border-border bg-card py-16 flex items-center justify-center">
 <Loader2 className="h-5 w-5 text-gold animate-spin" />
 </div>
 );
 }
 if (!list || list.length === 0) {
 return (
 <div className="rounded-sm border border-dashed border-border bg-card p-10 text-center">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
 No reviews yet
 </p>
 <p className="text-sm text-muted-foreground">
 Be the first to leave one.
 </p>
 </div>
 );
 }
 return (
 <ul className="space-y-3">
 {list.map((r) => (
 <ReviewCard key={r.id} review={r} />
 ))}
 </ul>
 );
};

const ReviewCard = ({ review }: { review: Review }) => {
 const avatarUrl = getAvatarUrl(review.authorAvatarPath);
 return (
 <li className="rounded-sm border border-border bg-card p-5">
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0">
 {avatarUrl ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={avatarUrl}
 alt=""
 className="h-10 w-10 rounded-full object-cover border border-border"
 />
 ) : (
 <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
 <User className="h-5 w-5 text-muted-foreground" strokeWidth={1.4} />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-baseline justify-between gap-3 flex-wrap">
 <p className="text-sm font-medium text-foreground truncate">
 {review.authorFullName || "Anonymous"}
 </p>
 <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
 {formatDate(review.createdAt)}
 </p>
 </div>
 <div className="mt-1 flex items-center gap-2">
 <StarsDisplay rating={review.rating} />
 <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 {review.rating}/5
 </span>
 </div>
 <p className="mt-2 text-sm font-medium text-foreground">
 {review.title}
 </p>
 {review.body ? (
 <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
 {review.body}
 </p>
 ) : null}
 </div>
 </div>
 </li>
 );
};

const StarsDisplay = ({ rating }: { rating: number }) => (
 <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
 {[1, 2, 3, 4, 5].map((n) => (
 <Star
 key={n}
 className={cn(
 "h-3.5 w-3.5",
 n <= rating ? "text-gold fill-gold" : "text-muted-foreground",
 )}
 strokeWidth={1.6}
 />
 ))}
 </div>
);

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Write review dialog

const WriteReviewDialog = ({
 open,
 onClose,
 targetRole,
 onPosted,
}: {
 open: boolean;
 onClose: () => void;
 targetRole: ReviewTargetRole;
 onPosted: () => void;
}) => {
 const [title, setTitle] = useState("");
 const [rating, setRating] = useState(0);
 const [hoverRating, setHoverRating] = useState(0);
 const [body, setBody] = useState("");
 const [posting, setPosting] = useState(false);

 // Reset the form whenever the dialog closes so a re-open is clean.
 useEffect(() => {
 if (!open) {
 setTitle("");
 setRating(0);
 setHoverRating(0);
 setBody("");
 setPosting(false);
 }
 }, [open]);

 const roleLabel = targetRole === "partner" ? "partner" : "founder";

 const canPost = useMemo(
 () => title.trim().length > 0 && rating >= 1 && rating <= 5 && !posting,
 [title, rating, posting],
 );

 const handleSubmit = async () => {
 if (!canPost) return;
 setPosting(true);
 try {
 await createReview({
 targetRole,
 title: title.trim(),
 rating,
 body: body.trim(),
 });
 onPosted();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Could not post.");
 setPosting(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
 <DialogContent className="max-w-md p-0 overflow-hidden">
 <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
 <DialogTitle className="font-display text-xl">
 Write a {roleLabel} review
 </DialogTitle>
 <DialogDescription className="text-xs text-muted-foreground">
 Three things: a title, a rating, and what made the experience
 what it was.
 </DialogDescription>
 </DialogHeader>

 <div className="px-6 py-5 space-y-5">
 {/* Title */}
 <div>
 <label
 htmlFor="review-title"
 className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5"
 >
 Title
 </label>
 <input
 id="review-title"
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="What stood out?"
 maxLength={120}
 className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
 />
 </div>

 {/* Star clicker */}
 <div>
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
 Rating
 </p>
 <div
 className="flex items-center gap-1"
 onMouseLeave={() => setHoverRating(0)}
 >
 {[1, 2, 3, 4, 5].map((n) => {
 const active = (hoverRating || rating) >= n;
 return (
 <button
 key={n}
 type="button"
 onMouseEnter={() => setHoverRating(n)}
 onClick={() => setRating(n)}
 aria-label={`${n} star${n === 1 ? "" : "s"}`}
 className="p-1 transition-transform hover:scale-110"
 >
 <Star
 className={cn(
 "h-7 w-7 transition-colors",
 active
 ? "text-gold fill-gold"
 : "text-muted-foreground",
 )}
 strokeWidth={1.5}
 />
 </button>
 );
 })}
 <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
 {rating > 0 ? `${rating}/5` : "Pick one"}
 </span>
 </div>
 </div>

 {/* Body */}
 <div>
 <label
 htmlFor="review-body"
 className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5"
 >
 Description
 </label>
 <textarea
 id="review-body"
 value={body}
 onChange={(e) => setBody(e.target.value)}
 placeholder="What went well, what didn't, what would you tell a friend?"
 maxLength={2000}
 rows={5}
 className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-y leading-relaxed"
 />
 </div>
 </div>

 <DialogFooter className="px-6 py-4 border-t border-border flex sm:justify-between gap-2">
 <Button variant="outline" size="sm" onClick={onClose} disabled={posting}>
 <X className="h-4 w-4" />
 Cancel
 </Button>
 <Button
 variant="gold"
 size="sm"
 onClick={handleSubmit}
 disabled={!canPost}
 >
 {posting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Posting…
 </>
 ) : (
 "Post review"
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Thank-you dialog

const ThanksDialog = ({
 open,
 onClose,
}: {
 open: boolean;
 onClose: () => void;
}) => (
 <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
 <DialogContent className="max-w-md p-0 overflow-hidden">
 <div className="px-6 pt-8 pb-6 text-center">
 {/* Illustration: a gold star with sparkles around it. Built
 entirely from lucide icons so it scales cleanly and inherits
 the theme palette. */}
 <ThanksIllustration />
 <DialogHeader className="mt-5 space-y-2">
 <DialogTitle className="font-display text-2xl">
 Thank you for your review
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 You just helped the next founder or partner make a better call.
 Reviews keep the Polln8 community honest, useful, and small for
 the right reasons.
 </DialogDescription>
 </DialogHeader>
 </div>
 <DialogFooter className="px-6 py-4 border-t border-border flex sm:justify-center">
 <Button variant="gold" size="lg" onClick={onClose}>
 Got it
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
);

const ThanksIllustration = () => (
 <div className="relative mx-auto h-28 w-28">
 {/* Outer ring - subtle muted circle that anchors the composition. */}
 <div className="absolute inset-0 rounded-full border-2 border-dashed border-border" />
 {/* Centre star, gold-filled. */}
 <div className="absolute inset-0 flex items-center justify-center">
 <Star
 className="h-14 w-14 text-gold fill-gold"
 strokeWidth={1.4}
 />
 </div>
 </div>
);

export default Reviews;
