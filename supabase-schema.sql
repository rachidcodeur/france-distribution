-- Schema Supabase pour France Distribution
-- Toutes les tables sont préfixées par france_distri_

-- Table des participations aux tournées
CREATE TABLE IF NOT EXISTS france_distri_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ville_name TEXT NOT NULL,
  tournee_date_debut TEXT NOT NULL,
  tournee_date_fin TEXT NOT NULL,
  tournee_index INTEGER NOT NULL,
  total_logements INTEGER NOT NULL,
  cout_distribution DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'bouclee')),
  has_flyer BOOLEAN DEFAULT FALSE,
  flyer_url TEXT,
  needs_flyer_creation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sélections d'IRIS par participation
CREATE TABLE IF NOT EXISTS france_distri_iris_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID REFERENCES france_distri_participations(id) ON DELETE CASCADE NOT NULL,
  iris_code TEXT NOT NULL,
  iris_name TEXT NOT NULL,
  logements INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_participations_user_id ON france_distri_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_ville_tournee ON france_distri_participations(ville_name, tournee_date_debut);
CREATE INDEX IF NOT EXISTS idx_iris_selections_participation ON france_distri_iris_selections(participation_id);
CREATE INDEX IF NOT EXISTS idx_iris_selections_code ON france_distri_iris_selections(iris_code);

-- Fonction pour compter les sélections par IRIS pour une tournée donnée
CREATE OR REPLACE FUNCTION france_distri_count_iris_selections(
  p_ville_name TEXT,
  p_tournee_date_debut TEXT,
  p_iris_code TEXT
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT participation_id)
    FROM france_distri_iris_selections
    WHERE iris_code = p_iris_code
      AND participation_id IN (
        SELECT id
        FROM france_distri_participations
        WHERE ville_name = p_ville_name
          AND tournee_date_debut = p_tournee_date_debut
          AND status != 'cancelled'
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Vue pour faciliter les requêtes de comptage
CREATE OR REPLACE VIEW france_distri_iris_counts AS
SELECT 
  p.ville_name,
  p.tournee_date_debut,
  isel.iris_code,
  isel.iris_name,
  COUNT(DISTINCT isel.participation_id) as selection_count
FROM france_distri_iris_selections isel
JOIN france_distri_participations p ON isel.participation_id = p.id
WHERE p.status != 'cancelled'
GROUP BY p.ville_name, p.tournee_date_debut, isel.iris_code, isel.iris_name;

-- RLS (Row Level Security) - Les utilisateurs peuvent voir leurs propres participations
ALTER TABLE france_distri_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE france_distri_iris_selections ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres participations
CREATE POLICY "Users can view their own participations"
  ON france_distri_participations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent créer leurs propres participations
CREATE POLICY "Users can create their own participations"
  ON france_distri_participations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent voir leurs propres sélections d'IRIS
CREATE POLICY "Users can view their own iris selections"
  ON france_distri_iris_selections
  FOR SELECT
  USING (
    participation_id IN (
      SELECT id FROM france_distri_participations WHERE user_id = auth.uid()
    )
  );

-- Policy : Les utilisateurs peuvent créer leurs propres sélections d'IRIS
CREATE POLICY "Users can create their own iris selections"
  ON france_distri_iris_selections
  FOR INSERT
  WITH CHECK (
    participation_id IN (
      SELECT id FROM france_distri_participations WHERE user_id = auth.uid()
    )
  );

-- Policy : Tout le monde peut voir les sélections d'IRIS (pour afficher les comptages sur la carte)
-- mais seulement les codes IRIS, pas les détails des utilisateurs
DROP POLICY IF EXISTS "Anyone can view iris counts" ON france_distri_iris_selections;
CREATE POLICY "Anyone can view iris counts"
  ON france_distri_iris_selections
  FOR SELECT
  USING (true);

-- Table des soumissions du formulaire de contact
CREATE TABLE IF NOT EXISTS france_distri_contacts_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour faciliter les tris / filtrages
CREATE INDEX IF NOT EXISTS idx_contacts_submissions_created_at ON france_distri_contacts_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_submissions_email ON france_distri_contacts_submissions(email);

-- RLS pour contrôler l'accès
ALTER TABLE france_distri_contacts_submissions ENABLE ROW LEVEL SECURITY;

-- Les visiteurs (anon) peuvent créer une soumission
CREATE POLICY "Anyone can create contact submission"
  ON france_distri_contacts_submissions
  FOR INSERT
  WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent lire les soumissions
CREATE POLICY "Authenticated can read contact submissions"
  ON france_distri_contacts_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

