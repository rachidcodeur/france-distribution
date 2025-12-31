# Configuration Supabase Storage pour les flyers

## Création du bucket

Pour permettre l'upload des flyers, vous devez créer un bucket dans Supabase Storage :

1. Allez dans votre projet Supabase
2. Naviguez vers **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**
4. Nommez le bucket : `flyers`
5. Activez **Public bucket** si vous voulez que les fichiers soient accessibles publiquement
6. Cliquez sur **Create bucket**

## Configuration des politiques RLS

Pour permettre aux utilisateurs d'uploader leurs propres flyers, créez une politique RLS :

```sql
-- Policy : Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own flyers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'flyers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : Les utilisateurs peuvent voir leurs propres fichiers
CREATE POLICY "Users can view their own flyers"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'flyers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : Les fichiers publics peuvent être vus par tous (si le bucket est public)
CREATE POLICY "Public flyers are viewable by everyone"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'flyers');
```

## Mise à jour du schéma

N'oubliez pas d'exécuter la mise à jour du schéma SQL pour ajouter les nouveaux champs :

```sql
ALTER TABLE france_distri_participations 
ADD COLUMN IF NOT EXISTS has_flyer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flyer_url TEXT,
ADD COLUMN IF NOT EXISTS needs_flyer_creation BOOLEAN DEFAULT FALSE;
```

