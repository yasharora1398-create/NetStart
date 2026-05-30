import type { Metadata } from "next";
import Reviews from "@/views/Reviews";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Reviews | What founders and partners say" },
 description:
 "Honest reviews from the Polln8 community. Read what partners say about founders and what founders say about partners, and share your own.",
 alternates: { canonical: "https://polln8.com/reviews" },
};

export default function Page() {
 return <Reviews />;
}
