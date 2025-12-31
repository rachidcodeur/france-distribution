-- Migration pour ajouter la colonne tournee_link à la table france_distri_participations
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne tournee_link si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'tournee_link'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN tournee_link TEXT;
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations' 
AND column_name = 'tournee_link';

