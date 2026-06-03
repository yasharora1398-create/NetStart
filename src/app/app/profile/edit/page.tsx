// /app/profile/edit - the editable form surface. Renders the
// existing profile-wizard view (originally /app/profile/edit) inside the
// standard /app/ chrome, so the chats/saved panel and the right
// rail stay visible while editing. No "Profile" branding shows up in
// this surface - the page title and inner copy refer to "profile"
// only.
import type { Metadata } from "next";
import ProfileEdit from "@/views/ProfileEdit";

export const metadata: Metadata = {
 title: { absolute: "Polln8 | Edit profile" },
 description:
 "Edit your Polln8 profile - bio, skills, location, commitment, and projects.",
 alternates: { canonical: "https://polln8.com/app/profile/edit" },
 robots: { index: false, follow: false },
};

export default function Page() {
 return <ProfileEdit />;
}
