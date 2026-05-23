import type { Metadata } from "next";
import NotFound from "@/views/NotFound";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Not found | Page does not exist" },
 description: "We couldn't find that page on Polln8.",
 robots: { index: false, follow: false },
};

export default function Page() {
 return <NotFound />;
}
