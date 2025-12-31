-- Migration pour ajouter les colonnes de flyer manquantes à la table france_distri_participations
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes de flyer si elles n'existent pas déjà
DO $$ 
BEGIN
  -- Colonne flyer_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_title'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_title TEXT;
  END IF;

  -- Colonne flyer_entreprise
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_entreprise'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_entreprise TEXT;
  END IF;

  -- Colonne flyer_telephone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_telephone'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_telephone TEXT;
  END IF;

  -- Colonne flyer_address_rue
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_rue'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_address_rue TEXT;
  END IF;

  -- Colonne flyer_address_code_postal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_code_postal'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_address_code_postal TEXT;
  END IF;

  -- Colonne flyer_address_ville
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_ville'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_address_ville TEXT;
  END IF;

  -- Colonne flyer_format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_format'
  ) THEN
    ALTER TABLE france_distri_participations 
    ADD COLUMN flyer_format TEXT;
  END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations' 
AND column_name LIKE 'flyer%'
ORDER BY column_name;

