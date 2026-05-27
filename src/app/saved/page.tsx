import type { Metadata } from "next";
import Saved from "@/views/Saved";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Saved | Your shortlist of matches" },
 description:
 "Your shortlist of potential cofounders and startup projects. Revisit top matches, track your active focus, and move the right connections toward a real conversation.",
 alternates: { canonical: "https://polln8.com/saved" },
 // Public intro cover + sign-up CTAs render for guests, so the page
 // is indexable. Inherits index:true/follow:true from the root
 // layout.
};

export default function Page() {
 return <Saved />;
}
