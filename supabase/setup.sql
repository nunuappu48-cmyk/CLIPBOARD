-- ========================================================
-- QuickClip Database Initialization & Schema
-- Tables: rooms, room_content, room_images
-- Security: Row Level Security, Secure Functions with Token Hashing
-- Realtime: Realtime publication for text & images
-- ========================================================

-- Enable pgcrypto extension for cryptographic functions if needed
create extension if not exists "pgcrypto";

-- 1. ROOMS TABLE
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  last_activity_at timestamptz not null default now(),
  max_images integer not null default 50,
  max_storage_bytes bigint not null default 104857600 -- 100 MB
);

-- Indexes for fast lookup and expiration cleanup
create index if not exists idx_rooms_expires_at on public.rooms (expires_at);
create index if not exists idx_rooms_last_activity on public.rooms (last_activity_at);

-- 2. ROOM CONTENT TABLE
create table if not exists public.room_content (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  text_content text not null default '',
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint check_text_length check (length(text_content) <= 50000)
);

-- 3. ROOM IMAGES TABLE
create table if not exists public.room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size bigint not null,
  uploaded_at timestamptz not null default now(),
  uploader_id text,
  constraint check_file_size check (file_size <= 10485760) -- Max 10MB
);

-- Indexes for room images
create index if not exists idx_room_images_room_id on public.room_images (room_id);
create index if not exists idx_room_images_uploaded_at on public.room_images (uploaded_at desc);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
alter table public.rooms enable row level security;
alter table public.room_content enable row level security;
alter table public.room_images enable row level security;

-- Drop existing policies if any
drop policy if exists "Deny direct public read of rooms" on public.rooms;
drop policy if exists "Deny direct public write of rooms" on public.rooms;
drop policy if exists "Allow reading room_content if not expired" on public.room_content;
drop policy if exists "Allow reading room_images if not expired" on public.room_images;

-- Rooms table: No direct direct select to prevent enumeration of hashes
create policy "Deny direct public select on rooms"
  on public.rooms for select
  using (false);

-- Room content: Allow select via Realtime/query only for active rooms
create policy "Allow reading room_content for active rooms"
  on public.room_content for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_content.room_id
        and r.expires_at > now()
    )
  );

-- Room images: Allow select for active rooms
create policy "Allow reading room_images for active rooms"
  on public.room_images for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_images.room_id
        and r.expires_at > now()
    )
  );

-- ========================================================
-- REALTIME REPLICATION CONFIGURATION
-- ========================================================
-- Enable replica identity full for complete realtime payload tracking
alter table public.room_content replica identity full;
alter table public.room_images replica identity full;

-- Add tables to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_content'
  ) then
    alter publication supabase_realtime add table public.room_content;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_images'
  ) then
    alter publication supabase_realtime add table public.room_images;
  end if;
end $$;

-- ========================================================
-- SECURITY DEFINER RPC API (VERIFIED TOKEN ACCESS)
-- ========================================================

-- Function 1: Create a room atomically with initial content
create or replace function public.create_quickclip_room(
  p_room_id uuid,
  p_token_hash text,
  p_initial_text text default '',
  p_expires_hours int default 24
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires_at timestamptz;
  v_result jsonb;
begin
  -- Validate parameters
  if p_room_id is null or p_token_hash is null or length(p_token_hash) < 16 then
    raise exception 'Invalid room parameters';
  end if;

  v_expires_at := now() + (p_expires_hours || ' hours')::interval;

  -- Insert room
  insert into public.rooms (id, access_token_hash, created_at, expires_at, last_activity_at)
  values (p_room_id, p_token_hash, now(), v_expires_at, now());

  -- Insert initial content
  insert into public.room_content (room_id, text_content, updated_at, version)
  values (p_room_id, coalesce(p_initial_text, ''), now(), 1);

  v_result := jsonb_build_object(
    'id', p_room_id,
    'expires_at', v_expires_at,
    'created_at', now(),
    'version', 1
  );

  return v_result;
end;
$$;

-- Function 2: Verify room access and get metadata
create or replace function public.verify_and_get_room(
  p_room_id uuid,
  p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_content record;
  v_image_count int;
  v_total_storage bigint;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  -- Refresh activity
  update public.rooms
  set last_activity_at = now(),
      expires_at = greatest(expires_at, now() + interval '24 hours')
  where id = p_room_id;

  select * into v_content from public.room_content where room_id = p_room_id;

  select count(*), coalesce(sum(file_size), 0)
  into v_image_count, v_total_storage
  from public.room_images
  where room_id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'room', jsonb_build_object(
      'id', v_room.id,
      'created_at', v_room.created_at,
      'expires_at', v_room.expires_at,
      'last_activity_at', now(),
      'max_images', v_room.max_images,
      'max_storage_bytes', v_room.max_storage_bytes,
      'image_count', v_image_count,
      'total_storage_bytes', v_total_storage
    ),
    'content', jsonb_build_object(
      'text_content', coalesce(v_content.text_content, ''),
      'updated_at', coalesce(v_content.updated_at, v_room.created_at),
      'version', coalesce(v_content.version, 1)
    )
  );
end;
$$;

-- Function 3: Update text content
create or replace function public.update_room_text(
  p_room_id uuid,
  p_token_hash text,
  p_text text,
  p_client_version int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_new_version int;
  v_updated_at timestamptz;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if length(p_text) > 50000 then
    return jsonb_build_object('success', false, 'error', 'TEXT_TOO_LONG');
  end if;

  v_updated_at := now();

  update public.room_content
  set text_content = p_text,
      version = version + 1,
      updated_at = v_updated_at
  where room_id = p_room_id
  returning version into v_new_version;

  -- Refresh room expiration and last activity
  update public.rooms
  set last_activity_at = v_updated_at,
      expires_at = greatest(expires_at, now() + interval '24 hours')
  where id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'updated_at', v_updated_at
  );
end;
$$;

-- Function 4: Clear text content
create or replace function public.clear_room_text(
  p_room_id uuid,
  p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_new_version int;
  v_updated_at timestamptz;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  v_updated_at := now();

  update public.room_content
  set text_content = '',
      version = version + 1,
      updated_at = v_updated_at
  where room_id = p_room_id
  returning version into v_new_version;

  update public.rooms
  set last_activity_at = v_updated_at,
      expires_at = greatest(expires_at, now() + interval '24 hours')
  where id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'version', v_new_version,
    'updated_at', v_updated_at
  );
end;
$$;

-- Function 5: Register uploaded image
create or replace function public.register_room_image(
  p_room_id uuid,
  p_token_hash text,
  p_image_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_file_size bigint,
  p_uploader_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_count int;
  v_total_storage bigint;
  v_new_image record;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  -- Validate file size (10MB limit)
  if p_file_size > 10485760 then
    return jsonb_build_object('success', false, 'error', 'FILE_TOO_LARGE');
  end if;

  -- Check room quotas
  select count(*), coalesce(sum(file_size), 0)
  into v_count, v_total_storage
  from public.room_images
  where room_id = p_room_id;

  if v_count >= v_room.max_images then
    return jsonb_build_object('success', false, 'error', 'MAX_IMAGES_REACHED');
  end if;

  if (v_total_storage + p_file_size) > v_room.max_storage_bytes then
    return jsonb_build_object('success', false, 'error', 'STORAGE_QUOTA_EXCEEDED');
  end if;

  -- Insert record
  insert into public.room_images (
    id,
    room_id,
    storage_path,
    original_filename,
    mime_type,
    file_size,
    uploaded_at,
    uploader_id
  )
  values (
    coalesce(p_image_id, gen_random_uuid()),
    p_room_id,
    p_storage_path,
    p_original_filename,
    p_mime_type,
    p_file_size,
    now(),
    p_uploader_id
  )
  returning * into v_new_image;

  -- Refresh activity
  update public.rooms
  set last_activity_at = now(),
      expires_at = greatest(expires_at, now() + interval '24 hours')
  where id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'image', row_to_json(v_new_image)
  );
end;
$$;

-- Function 6: Delete an image
create or replace function public.delete_room_image(
  p_room_id uuid,
  p_token_hash text,
  p_image_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_storage_path text;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  select storage_path into v_storage_path
  from public.room_images
  where id = p_image_id and room_id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'IMAGE_NOT_FOUND');
  end if;

  delete from public.room_images
  where id = p_image_id and room_id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'storage_path', v_storage_path
  );
end;
$$;

-- Function 7: Get room images
create or replace function public.get_room_images(
  p_room_id uuid,
  p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_images jsonb;
begin
  select * into v_room from public.rooms where id = p_room_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
  end if;

  if v_room.expires_at <= now() then
    return jsonb_build_object('success', false, 'error', 'ROOM_EXPIRED');
  end if;

  if v_room.access_token_hash != p_token_hash then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  select coalesce(jsonb_agg(row_to_json(ri) order by ri.uploaded_at desc), '[]'::jsonb)
  into v_images
  from public.room_images ri
  where ri.room_id = p_room_id;

  return jsonb_build_object(
    'success', true,
    'images', v_images
  );
end;
$$;

-- Function 8: Server-side cleanup of expired rooms
create or replace function public.cleanup_expired_rooms()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count int;
begin
  with deleted as (
    delete from public.rooms
    where expires_at < now()
    returning id
  )
  select count(*) into v_deleted_count from deleted;

  return v_deleted_count;
end;
$$;

-- Clean up legacy direct storage delete trigger (Supabase restricts direct SQL deletion on storage.objects; client uses Storage API directly)
drop trigger if exists trigger_delete_storage_image on public.room_images;
drop function if exists public.delete_storage_object_on_image_delete();

-- ========================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES
-- ========================================================

-- Create the private bucket 'quickclip-images' if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quickclip-images',
  'quickclip-images',
  false,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Storage access policies for quickclip-images
-- 1. Allow upload into room folder
create policy "Allow upload to quickclip-images for rooms"
  on storage.objects for insert
  with check (
    bucket_id = 'quickclip-images'
    and (storage.foldername(name))[1] = 'rooms'
  );

-- 2. Allow read (signed URLs or direct for active rooms)
create policy "Allow read quickclip-images for rooms"
  on storage.objects for select
  using (
    bucket_id = 'quickclip-images'
  );

-- 3. Allow delete from quickclip-images
create policy "Allow delete quickclip-images"
  on storage.objects for delete
  using (
    bucket_id = 'quickclip-images'
  );
