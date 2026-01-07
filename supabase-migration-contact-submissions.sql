-- Migration pour créer la table des soumissions du formulaire de contact
-- Exécutez ce script dans l'éditeur SQL Supabase si la table n'existe pas

-- Table de stockage des messages du formulaire de contact public
CREATE TABLE IF NOT EXISTS france_distri_contacts_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index utiles pour les tris et recherches
CREATE INDEX IF NOT EXISTS idx_contacts_submissions_created_at ON france_distri_contacts_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_submissions_email ON france_distri_contacts_submissions(email);

-- Activer la RLS pour sécuriser l'accès
ALTER TABLE france_distri_contacts_submissions ENABLE ROW LEVEL SECURITY;

-- Autoriser tout utilisateur (même non authentifié) à soumettre le formulaire
DROP POLICY IF EXISTS "Anyone can create contact submission" ON france_distri_contacts_submissions;
CREATE POLICY "Anyone can create contact submission"
  ON france_distri_contacts_submissions
  FOR INSERT
  WITH CHECK (true);

-- Lecture réservée aux utilisateurs authentifiés (service_role bypass automatiquement)
DROP POLICY IF EXISTS "Authenticated can read contact submissions" ON france_distri_contacts_submissions;
CREATE POLICY "Authenticated can read contact submissions"
  ON france_distri_contacts_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Vérifications rapides
-- SELECT * FROM france_distri_contacts_submissions LIMIT 5;

