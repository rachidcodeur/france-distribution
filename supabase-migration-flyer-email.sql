-- Migration pour ajouter la colonne flyer_email à la table france_distri_participations
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne flyer_email si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_email'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_email TEXT;
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations' 
AND column_name = 'flyer_email';

