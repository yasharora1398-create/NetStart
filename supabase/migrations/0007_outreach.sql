-- NetStart founder outreach
-- Adds a way for founders to notify saved candidates directly.
-- Idempotent: safe to re-run.

-- 1. Allow new notification type ------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'profile_accepted',
    'profile_rejected',
    'founder_outreach'
  ));

-- 2. Notify candidates from a project owner -------------------------
create or replace function public.notify_candidates(
  p_id uuid,
  candidate_ids uuid[],
  outreach_message text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  founder_name text;
  founder_linkedin text;
  cid uuid;
  body_text text;
  count_inserted integer := 0;
begin
  select id, owner_id, title into proj
  from public.projects
  where id = p_id;

  if proj.id is null then
    raise exception 'project not found';
  end if;

  if proj.owner_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select coalesce(nullif(full_name, ''), 'A founder'), coalesce(linkedin_url, '')
  into founder_name, founder_linkedin
  from public.profiles
  where user_id = auth.uid();

  foreach cid in array candidate_ids loop
    body_text := 'About project: ' || proj.title;
    if outreach_message is not null and length(trim(outreach_message)) > 0 then
      body_text := body_text || E'\n\n' || trim(outreach_message);
    end if;
    if length(founder_linkedin) > 0 then
      body_text := body_text || E'\n\nReach back via LinkedIn: ' || founder_linkedin;
    end if;

    insert into public.notifications (user_id, type, title, body, link)
    values (
      cid,
      'founder_outreach',
      founder_name || ' wants to connect',
      body_text,
      '/talent'
    );
    count_inserted := count_inserted + 1;
  end loop;

  return count_inserted;
end $$;

grant execute on function public.notify_candidates(uuid, uuid[], text) to authenticated;
