-- Migration pour ajouter les colonnes flyer à la table france_distri_participations
-- Exécutez ce script dans l'éditeur SQL de Supabase si les colonnes n'existent pas encore

-- Ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
    -- Ajouter has_flyer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'france_distri_participations' 
        AND column_name = 'has_flyer'
    ) THEN
        ALTER TABLE france_distri_participations 
        ADD COLUMN has_flyer BOOLEAN DEFAULT FALSE;
    END IF;

    -- Ajouter flyer_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'france_distri_participations' 
        AND column_name = 'flyer_url'
    ) THEN
        ALTER TABLE france_distri_participations 
        ADD COLUMN flyer_url TEXT;
    END IF;

    -- Ajouter needs_flyer_creation
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'france_distri_participations' 
        AND column_name = 'needs_flyer_creation'
    ) THEN
        ALTER TABLE france_distri_participations 
        ADD COLUMN needs_flyer_creation BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'france_distri_participations'
AND column_name IN ('has_flyer', 'flyer_url', 'needs_flyer_creation')
ORDER BY column_name;

