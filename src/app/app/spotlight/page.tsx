import type { Metadata } from "next";
import Spotlight from "@/views/Spotlight";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Spotlight | Boost + Verified for 75 cents" },
 description:
 "The combo SKU. 72-hour pin at the top of the Match deck plus the permanent blue verified badge, for 75 cents. 25% off versus buying each perk separately.",
 alternates: { canonical: "https://polln8.com/spotlight" },
};

export default function Page() {
 return <Spotlight />;
}
