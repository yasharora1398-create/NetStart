-- Account deletion. Lets a signed-in user nuke their own account
-- and all data attached to it from the client without going through
-- support. SECURITY DEFINER + run as `postgres` so we can delete
-- from auth.users; cascades handle most public.* rows but we also
-- explicitly clean a few that don't have FK cascades to auth.users.
--
-- Idempotent: safe to re-run.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- Best-effort cleanup of rows that don't auto-cascade. Each is
  -- wrapped in a try/catch via plpgsql block so a missing table
  -- (e.g. on a partial schema) doesn't abort the whole delete.
  begin delete from public.notifications where user_id = uid; exception when others then null; end;
  begin delete from public.notifications where from_user_id = uid; exception when others then null; end;
  begin delete from public.chat_messages where sender_id = uid or recipient_id = uid; exception when others then null; end;
  begin delete from public.chat_contacts where user_id = uid or contact_id = uid; exception when others then null; end;
  begin delete from public.applications where candidate_user_id = uid; exception when others then null; end;
  begin delete from public.saved_people where person_id = uid; exception when others then null; end;
  begin delete from public.rate_limit_events where user_id = uid; exception when others then null; end;
  begin delete from public.push_tokens where user_id = uid; exception when others then null; end;
  begin delete from public.projects where owner_id = uid; exception when others then null; end;
  begin delete from public.profiles where user_id = uid; exception when others then null; end;

  -- Finally remove the auth user. The supabase project's `postgres`
  -- role can do this when the function is SECURITY DEFINER and
  -- owner is `postgres` (the default for SQL-editor created funcs).
  delete from auth.users where id = uid;
end $$;

grant execute on function public.delete_my_account() to authenticated;
