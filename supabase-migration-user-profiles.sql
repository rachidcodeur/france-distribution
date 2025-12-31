-- Migration pour créer la table des profils utilisateur
-- Table pour stocker les informations personnelles des utilisateurs

CREATE TABLE IF NOT EXISTS france_distri_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nom TEXT,
  prenom TEXT,
  entreprise TEXT,
  telephone TEXT,
  adresse_rue TEXT,
  adresse_code_postal TEXT,
  adresse_ville TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON france_distri_user_profiles(user_id);

-- RLS (Row Level Security) - Permettre aux utilisateurs de lire et modifier uniquement leur propre profil
ALTER TABLE france_distri_user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de lire leur propre profil
CREATE POLICY "Users can view their own profile"
  ON france_distri_user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can create their own profile"
  ON france_distri_user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
  ON france_distri_user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON france_distri_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

