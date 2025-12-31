-- Script pour exporter les données de l'ANCIEN projet Supabase
-- Exécutez ce script dans l'éditeur SQL de l'ANCIEN projet Supabase
-- Les résultats seront affichés en JSON que vous pourrez copier

-- 1. Exporter les participations
SELECT 
  id,
  user_id,
  ville_name,
  tournee_date_debut,
  tournee_date_fin,
  tournee_index,
  total_logements,
  cout_distribution,
  status,
  has_flyer,
  flyer_url,
  needs_flyer_creation,
  flyer_format,
  flyer_title,
  flyer_entreprise,
  flyer_address_rue,
  flyer_address_code_postal,
  flyer_address_ville,
  created_at,
  updated_at
FROM france_distri_participations
ORDER BY created_at;

-- 2. Exporter les sélections d'IRIS
-- Note: Vous devrez d'abord exporter les participations pour avoir leurs IDs
SELECT 
  isel.id,
  isel.participation_id,
  isel.iris_code,
  isel.iris_name,
  isel.logements,
  isel.created_at,
  p.user_id,
  p.ville_name,
  p.tournee_date_debut
FROM france_distri_iris_selections isel
JOIN france_distri_participations p ON isel.participation_id = p.id
ORDER BY isel.created_at;

-- 3. Exporter les utilisateurs (si nécessaire pour la migration)
-- Note: Les user_id doivent correspondre aux nouveaux utilisateurs dans le nouveau projet
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at;

