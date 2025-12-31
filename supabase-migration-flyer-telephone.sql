-- Migration pour ajouter la colonne flyer_telephone à la table france_distri_participations
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter flyer_telephone si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'france_distri_participations' 
    AND column_name = 'flyer_telephone'
  ) THEN
    ALTER TABLE france_distri_participations ADD COLUMN flyer_telephone TEXT;
  END IF;
END $$;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'france_distri_participations'
AND column_name = 'flyer_telephone';

