-- Script complet pour configurer un nouveau projet Supabase
-- Exécutez ce script dans l'ordre dans l'éditeur SQL du NOUVEAU projet

-- ============================================
-- ÉTAPE 1 : Créer les tables de base
-- ============================================
-- Exécutez d'abord: supabase-schema.sql
-- (Ce fichier contient la création des tables principales)

-- ============================================
-- ÉTAPE 2 : Ajouter les colonnes flyer
-- ============================================
-- Exécutez ensuite: supabase-migration-flyer.sql

-- ============================================
-- ÉTAPE 3 : Ajouter les colonnes participants
-- ============================================
-- Exécutez ensuite: supabase-migration-participants.sql

-- ============================================
-- ÉTAPE 4 : Ajouter le statut 'bouclee'
-- ============================================
-- Exécutez ensuite: supabase-migration-status-bouclee.sql

-- ============================================
-- ÉTAPE 5 : Corriger les politiques RLS
-- ============================================
-- Exécutez ensuite: supabase-fix-rls-policy.sql

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
-- Après avoir exécuté tous les scripts ci-dessus, exécutez ce qui suit :

-- Vérifier que les tables existent
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nombre_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'france_distri_%'
ORDER BY table_name;

-- Vérifier toutes les colonnes de france_distri_participations
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'france_distri_%'
ORDER BY tablename, policyname;

-- Vérifier les contraintes
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid::regclass::text LIKE 'france_distri_%'
ORDER BY conname;

