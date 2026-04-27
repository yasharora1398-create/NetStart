-- NetStart chat & review requests
-- Lets either side ping the other with a lightweight request that lands in
-- their notifications, separate from the formal Application flow.
-- Idempotent: safe to re-run.

-- 1. Allow new notification types -----------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'profile_accepted',
    'profile_rejected',
    'founder_outreach',
    'chat_request',
    'review_request'
  ));

-- 2. Founder asks an operator to chat -------------------------------
-- Caller is the founder. Inserts a chat_request notification on the
-- target operator's account.
create or replace function public.request_chat(
  target_user_id uuid,
  project_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  founder_name text;
  founder_linkedin text;
  body_text text;
  link_text text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'invalid target';
  end if;

  select coalesce(nullif(full_name, ''), 'A founder'),
         coalesce(linkedin_url, '')
  into founder_name, founder_linkedin
  from public.profiles
  where user_id = auth.uid();

  body_text := founder_name || ' would like to start a conversation.';
  if length(founder_linkedin) > 0 then
    body_text := body_text || E'\n\nLinkedIn: ' || founder_linkedin;
  end if;

  link_text := '/chats';

  insert into public.notifications (user_id, type, title, body, link)
  values (
    target_user_id,
    'chat_request',
    founder_name || ' wants to chat',
    body_text,
    link_text
  );
end $$;

grant execute on function public.request_chat(uuid, uuid) to authenticated;

-- 3. Operator asks a founder to look at their profile ---------------
-- Caller is the operator. Looks up the project's owner and inserts a
-- review_request notification for them.
create or replace function public.request_review(
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  operator_name text;
  operator_headline text;
  body_text text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id, owner_id, title into proj
  from public.projects
  where id = p_id;

  if proj.id is null then
    raise exception 'project not found';
  end if;
  if proj.owner_id = auth.uid() then
    raise exception 'cannot request review on your own project';
  end if;

  select coalesce(nullif(full_name, ''), 'An operator'),
         coalesce(headline, '')
  into operator_name, operator_headline
  from public.profiles
  where user_id = auth.uid();

  body_text := operator_name;
  if length(operator_headline) > 0 then
    body_text := body_text || ' (' || operator_headline || ')';
  end if;
  body_text := body_text || ' is interested in: ' || proj.title;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    proj.owner_id,
    'review_request',
    operator_name || ' wants you to look at them',
    body_text,
    '/mynet'
  );
end $$;

grant execute on function public.request_review(uuid) to authenticated;
