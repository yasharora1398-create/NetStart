import type { Metadata } from "next";
import DownloadPage from "@/views/DownloadPage";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Download | Cofounder search on mobile" },
 description:
 "Take your cofounder search mobile. The Polln8 app is coming soon to iOS and Android. Find your next startup partner from anywhere.",
 alternates: { canonical: "https://polln8.com/download" },
};

export default function Page() {
 return <DownloadPage />;
}
