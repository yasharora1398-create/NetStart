// /app entry point. The actual app lives under /app/match etc.;
// hitting bare /app should drop the user into the Match deck (the
// canonical starting page for signed-in users) rather than rendering
// nothing.
import { redirect } from "next/navigation";

export default function AppRoot() {
 redirect("/app/match");
}
