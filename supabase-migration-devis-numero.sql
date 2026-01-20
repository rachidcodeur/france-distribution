-- Ajout d'un numéro de devis par participation
-- À exécuter dans l'éditeur SQL Supabase.

alter table if exists public.france_distri_participations
  add column if not exists devis_numero text;

-- Unicité (uniquement quand la valeur est présente)
create unique index if not exists france_distri_participations_devis_numero_uidx
  on public.france_distri_participations (devis_numero)
  where devis_numero is not null;

