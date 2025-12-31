-- Migration pour ajouter les colonnes manquantes pour les participants
-- flyer_title, flyer_entreprise, flyer_address_*

-- Ajouter flyer_title si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_title'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_title TEXT;
  END IF;
END $$;

-- Ajouter flyer_entreprise si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_entreprise'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_entreprise TEXT;
  END IF;
END $$;

-- Ajouter flyer_address_rue si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_rue'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_address_rue TEXT;
  END IF;
END $$;

-- Ajouter flyer_address_code_postal si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_code_postal'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_address_code_postal TEXT;
  END IF;
END $$;

-- Ajouter flyer_address_ville si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_address_ville'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_address_ville TEXT;
  END IF;
END $$;

-- Ajouter flyer_format si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_format'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_format TEXT;
  END IF;
END $$;

-- Policy pour permettre à tous de voir les participations (pour afficher les comptages et détails publics)
DROP POLICY IF EXISTS "Anyone can view participations for counts" ON france_distri_participations;
CREATE POLICY "Anyone can view participations for counts"
  ON france_distri_participations
  FOR SELECT
  USING (status != 'cancelled');

