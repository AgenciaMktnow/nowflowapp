-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_full_name text;
  raw_avatar_url text;
  computed_name text;
begin
  -- Extract metadata from raw_user_meta_data
  raw_full_name := new.raw_user_meta_data->>'full_name';
  raw_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Fallback logic for name
  if raw_full_name is null or length(raw_full_name) = 0 then
    -- Try 'name' field
    raw_full_name := new.raw_user_meta_data->>'name';
  end if;

  if raw_full_name is null or length(raw_full_name) = 0 then
    -- Try constructing from first_name + last_name
    computed_name := trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', ''));
    if length(computed_name) > 0 then
        raw_full_name := computed_name;
    end if;
  end if;
  
  -- If still null, fallback to email prefix or generic
  if raw_full_name is null or length(raw_full_name) = 0 then
     raw_full_name := split_part(new.email, '@', 1);
  end if;

  -- Insert into public.users
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    raw_full_name,
    raw_avatar_url,
    'MEMBER' -- Default role, can be adjusted
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.users.full_name, excluded.full_name), -- Keep existing name if present
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger (safe idempotency)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
