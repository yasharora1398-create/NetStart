import type { Metadata } from "next";
import Match from "@/views/Match";
import { BoostPopup } from "@/components/netstart/BoostPopup";
import { SpotlightModal } from "@/components/netstart/SpotlightModal";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Match | Discover vetted startup talent" },
 description:
 "Swipe through vetted startup talent. Founders discover skilled partners ranked against their project. Partners explore real cofounder opportunities filtered by skill, location, and commitment level.",
 alternates: { canonical: "https://polln8.com/match" },
 // Public intro cover + sign-up CTAs render for guests, so the page
 // is indexable. Inherits index:true/follow:true from the root
 // layout.
};

export default function Page() {
 return (
 <>
 <Match />
 {/* Desktop: non-blocking bottom-right popup. BoostPopup
 itself doesn't gate on viewport, so we wrap it here. */}
 <div className="hidden md:block">
 <BoostPopup />
 </div>
 {/* Mobile: blocking full-screen Spotlight modal. Renders
 nothing on md+. */}
 <SpotlightModal />
 </>
 );
}
