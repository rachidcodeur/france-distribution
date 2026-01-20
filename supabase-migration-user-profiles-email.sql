-- Ajout du champ email au profil utilisateur

alter table if exists public.france_distri_user_profiles
  add column if not exists email text;

create index if not exists idx_user_profiles_email
  on public.france_distri_user_profiles (email);

