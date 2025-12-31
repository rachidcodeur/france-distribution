-- Migration pour ajouter le statut 'bouclee' à la table france_distri_participations
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE france_distri_participations
DROP CONSTRAINT IF EXISTS france_distri_participations_status_check;

-- Ajouter la nouvelle contrainte CHECK avec le statut 'bouclee'
ALTER TABLE france_distri_participations
ADD CONSTRAINT france_distri_participations_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'bouclee'));

-- Vérifier que la contrainte a été ajoutée
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'france_distri_participations'::regclass
  AND conname = 'france_distri_participations_status_check';

