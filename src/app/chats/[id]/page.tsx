import type { Metadata } from "next";
import Chats from "@/views/Chats";

export const metadata: Metadata = {
  title: "Chats",
  description:
    "Connect with your cofounder candidates. Polln8's built-in messaging keeps your startup conversations organized with request controls that ensure every chat is mutual and intentional.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Chats />;
}
