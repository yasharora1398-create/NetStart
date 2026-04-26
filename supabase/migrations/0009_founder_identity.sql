-- NetStart founder identity
-- Project listings now expose the founder's public profile fields so
-- candidates can see who's behind each project before applying.
-- Idempotent: safe to re-run.

-- Replace match_projects_for_me with founder-enriched return.
drop function if exists public.match_projects_for_me();
create function public.match_projects_for_me()
returns table (
  id                uuid,
  owner_id          uuid,
  title             text,
  description       text,
  criteria          jsonb,
  created_at        timestamptz,
  similarity        real,
  founder_full_name text,
  founder_headline  text,
  founder_avatar    text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  my_emb vector(768);
begin
  select embedding into my_emb
  from public.profiles where user_id = auth.uid();

  return query
    select
      p.id, p.owner_id, p.title, p.description,
      p.criteria, p.created_at,
      case
        when my_emb is null or p.embedding is null then 0::real
        else (1.0 - (p.embedding <=> my_emb))::real
      end as similarity,
      coalesce(fp.full_name, ''),
      coalesce(fp.headline, ''),
      fp.avatar_path
    from public.projects p
    left join public.profiles fp on fp.user_id = p.owner_id
    where p.is_published = true
      and p.owner_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    order by similarity desc nulls last;
end $$;
grant execute on function public.match_projects_for_me() to authenticated;

-- New RPC for the non-AI fallback path so founder data is available
-- whether or not VITE_GEMINI_API_KEY is configured.
drop function if exists public.list_published_projects_with_founder();
create function public.list_published_projects_with_founder()
returns table (
  id                uuid,
  owner_id          uuid,
  title             text,
  description       text,
  criteria          jsonb,
  created_at        timestamptz,
  founder_full_name text,
  founder_headline  text,
  founder_avatar    text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.owner_id, p.title, p.description,
    p.criteria, p.created_at,
    coalesce(fp.full_name, ''),
    coalesce(fp.headline, ''),
    fp.avatar_path
  from public.projects p
  left join public.profiles fp on fp.user_id = p.owner_id
  where p.is_published = true
  order by p.created_at desc;
$$;
grant execute on function public.list_published_projects_with_founder() to authenticated;
