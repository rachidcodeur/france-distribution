-- Script pour importer les données dans le NOUVEAU projet Supabase
-- ⚠️ IMPORTANT: Exécutez d'abord supabase-schema.sql pour créer les tables
-- ⚠️ IMPORTANT: Exécutez aussi les migrations (flyer, participants, status-bouclee)

-- ÉTAPE 1: Créer les tables (si pas déjà fait)
-- Exécutez d'abord: supabase-schema.sql

-- ÉTAPE 2: Appliquer les migrations (si pas déjà fait)
-- Exécutez: supabase-migration-flyer.sql
-- Exécutez: supabase-migration-participants.sql
-- Exécutez: supabase-migration-status-bouclee.sql
-- Exécutez: supabase-fix-rls-policy.sql

-- ÉTAPE 3: Importer les participations
-- Remplacez les valeurs ci-dessous par les données exportées de l'ancien projet
-- ⚠️ ATTENTION: Les user_id doivent correspondre aux IDs des utilisateurs dans le NOUVEAU projet
-- Vous devrez peut-être créer un mapping entre les anciens et nouveaux user_id

-- Exemple d'import (remplacez par vos vraies données):
/*
INSERT INTO france_distri_participations (
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
) VALUES
-- Collez ici les données exportées de l'ancien projet
-- Format: (uuid, uuid, 'ville', 'date', 'date', 0, 1000, 100.00, 'pending', false, null, false, null, null, null, null, null, null, NOW(), NOW())
;

-- ÉTAPE 4: Importer les sélections d'IRIS
-- ⚠️ ATTENTION: Les participation_id doivent correspondre aux nouveaux IDs de participations
INSERT INTO france_distri_iris_selections (
  id,
  participation_id,
  iris_code,
  iris_name,
  logements,
  created_at
) VALUES
-- Collez ici les données exportées de l'ancien projet
-- Format: (uuid, uuid, 'code', 'nom', 100, NOW())
;
*/

-- ÉTAPE 5: Vérifier les données importées
SELECT COUNT(*) as total_participations FROM france_distri_participations;
SELECT COUNT(*) as total_iris_selections FROM france_distri_iris_selections;

-- Vérifier les relations
SELECT 
  p.id,
  p.ville_name,
  COUNT(isel.id) as nombre_iris
FROM france_distri_participations p
LEFT JOIN france_distri_iris_selections isel ON p.id = isel.participation_id
GROUP BY p.id, p.ville_name;

