import type { Metadata } from "next";
import Boost from "@/views/Boost";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Boost | Top of the deck for 72 hours" },
 description:
 "Pin your card to the top of the opposite-role Match deck for 72 hours. Ten cents, one-time, no subscription.",
 alternates: { canonical: "https://polln8.com/boost" },
};

export default function Page() {
 return <Boost />;
}
