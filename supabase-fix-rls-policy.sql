-- Script pour corriger les politiques RLS qui bloquent l'insertion
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer l'ancienne politique d'insertion si elle existe
DROP POLICY IF EXISTS "Users can create their own participations" ON france_distri_participations;

-- Recréer la politique d'insertion avec une vérification plus permissive
-- Cette politique permet à un utilisateur authentifié de créer une participation
-- en s'assurant que le user_id correspond bien à l'utilisateur connecté
CREATE POLICY "Users can create their own participations"
  ON france_distri_participations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Vérifier que la politique a été créée
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
  AND policyname = 'Users can create their own participations';

