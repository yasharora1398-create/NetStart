-- NetStart AI matching
-- Adds vector embeddings to profiles and projects, plus server-side
-- cosine similarity matching RPCs.
-- Idempotent: safe to re-run.

-- 1. pg_vector extension --------------------------------------------
create extension if not exists vector;

-- 2. Embedding columns (Gemini text-embedding-004 = 768 dims) -------
alter table public.profiles add column if not exists embedding vector(768);
alter table public.projects add column if not exists embedding vector(768);

-- 3. HNSW indexes for fast cosine search ----------------------------
do $$ begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'profiles_embedding_idx'
  ) then
    create index profiles_embedding_idx on public.profiles
      using hnsw (embedding vector_cosine_ops);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'projects_embedding_idx'
  ) then
    create index projects_embedding_idx on public.projects
      using hnsw (embedding vector_cosine_ops);
  end if;
end $$;

-- 4. Match candidates for a project (founder side AI Find People) ---
drop function if exists public.match_candidates_for_project(uuid);
create function public.match_candidates_for_project(p_id uuid)
returns table (
  user_id              uuid,
  full_name            text,
  linkedin_url         text,
  headline             text,
  bio                  text,
  skills               jsonb,
  candidate_location   text,
  candidate_commitment text,
  resume_name          text,
  resume_path          text,
  avatar_path          text,
  similarity           real
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  proj_emb vector(768);
begin
  select embedding into proj_emb
  from public.projects where id = p_id;

  return query
    select
      p.user_id, coalesce(p.full_name, ''),
      coalesce(p.linkedin_url, ''),
      p.headline, p.bio, p.skills,
      p.candidate_location, p.candidate_commitment,
      p.resume_name, p.resume_path, p.avatar_path,
      case
        when proj_emb is null or p.embedding is null then 0::real
        else (1.0 - (p.embedding <=> proj_emb))::real
      end as similarity
    from public.profiles p
    where p.is_open_to_work = true
      and p.review_status = 'accepted'
      and p.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    order by similarity desc nulls last;
end $$;
grant execute on function public.match_candidates_for_project(uuid) to authenticated;

-- 5. Match projects for the current user (candidate side AI Find Projects)
drop function if exists public.match_projects_for_me();
create function public.match_projects_for_me()
returns table (
  id            uuid,
  owner_id      uuid,
  title         text,
  description   text,
  criteria      jsonb,
  created_at    timestamptz,
  similarity    real
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
      end as similarity
    from public.projects p
    where p.is_published = true
      and p.owner_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    order by similarity desc nulls last;
end $$;
grant execute on function public.match_projects_for_me() to authenticated;
