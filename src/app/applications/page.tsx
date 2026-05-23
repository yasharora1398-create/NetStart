import type { Metadata } from "next";
import Applications from "@/views/Applications";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Applications | Manage cofounder requests" },
 description:
 "Track every cofounder inquiry in one place. Review incoming applications to your projects or follow up on ones you've sent. Manage your startup pipeline without the noise.",
 alternates: { canonical: "https://polln8.com/applications" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <Applications />;
}
