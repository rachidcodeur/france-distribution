-- Script pour vérifier et corriger les politiques RLS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier les politiques existantes
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
WHERE tablename = 'france_distri_participations'
ORDER BY policyname;

-- 2. Supprimer l'ancienne politique d'insertion si elle existe
DROP POLICY IF EXISTS "Users can create their own participations" ON france_distri_participations;

-- 3. Recréer la politique d'insertion avec une vérification plus permissive
CREATE POLICY "Users can create their own participations"
  ON france_distri_participations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- 4. Vérifier que la politique a été créée
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'france_distri_participations'
  AND policyname = 'Users can create their own participations';

-- 5. Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'france_distri_participations';

