import type { Metadata } from "next";
import Chats from "@/views/Chats";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Chats | Talk to your matches" },
 description:
 "Connect with your cofounder candidates. Polln8's built-in messaging keeps your startup conversations organized with request controls that ensure every chat is mutual and intentional.",
 alternates: { canonical: "https://polln8.com/chats" },
 // Public intro cover + sign-up CTAs render for guests, so the page
 // is indexable. Inherits index:true/follow:true from the root
 // layout. (Individual chat threads at /chats/[id] stay noindex -
 // they're private content.)
};

export default function Page() {
 return <Chats />;
}
