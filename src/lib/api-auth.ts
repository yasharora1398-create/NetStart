import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

// Pulls the signed-in user out of an Authorization: Bearer <jwt>
// header. Used by API route handlers (src/app/api/.../route.ts) so
// they can authenticate the caller without pulling in
// @supabase/auth-helpers-nextjs.
//
// The frontend grabs the user's access token via
// getSupabase().auth.getSession() and sends it in the header. Here
// we hand the token to a fresh Supabase client and let it validate
// the JWT against the project's signing key. Returns null on any
// failure - callers should treat that as "not signed in" and 401.
export const getUserFromAuthHeader = async (
 req: Request,
): Promise<User | null> => {
 const header = req.headers.get("authorization") ?? "";
 const match = header.match(/^Bearer\s+(.+)$/i);
 if (!match) return null;
 const token = match[1];

 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !anon) return null;

 const client = createClient(url, anon, {
 auth: {
 persistSession: false,
 autoRefreshToken: false,
 },
 });
 const { data, error } = await client.auth.getUser(token);
 if (error || !data.user) return null;
 return data.user;
};
