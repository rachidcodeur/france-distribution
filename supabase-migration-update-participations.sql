-- Script pour ajouter la politique RLS permettant aux utilisateurs de mettre à jour leurs propres participations
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Vérifier les politiques existantes
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

-- Supprimer l'ancienne politique de mise à jour si elle existe
DROP POLICY IF EXISTS "Users can update their own participations" ON france_distri_participations;

-- Créer la politique de mise à jour
-- Cette politique permet à un utilisateur authentifié de mettre à jour ses propres participations
CREATE POLICY "Users can update their own participations"
  ON france_distri_participations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vérifier que la politique a été créée
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'france_distri_participations'
  AND policyname = 'Users can update their own participations';

