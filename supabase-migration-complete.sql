-- Migration complète pour ajouter les colonnes manquantes à la table france_distri_participations
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

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations' 
AND column_name IN ('flyer_email', 'tournee_link')
ORDER BY column_name;

