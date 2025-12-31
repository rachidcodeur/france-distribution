# Guide de migration vers un nouveau projet Supabase

## Vue d'ensemble

Ce guide vous explique comment migrer vos données de l'ancien projet Supabase vers le nouveau projet.

## ⚠️ Prérequis

1. Avoir accès aux deux projets Supabase (ancien et nouveau)
2. Avoir les **SERVICE_ROLE_KEY** (pas l'ANON_KEY) des deux projets
   - Dans Supabase Dashboard → Settings → API → service_role (secret)
3. Avoir Node.js installé (pour le script de migration automatique)

## 🚀 Méthode rapide : Migration automatique (Recommandée)

### Étape 1 : Préparer le fichier de configuration

1. Copiez `.env.migration.example` en `.env.migration`
2. Remplissez les valeurs avec les clés des deux projets :
   ```env
   OLD_SUPABASE_URL=https://ancien-projet-id.supabase.co
   OLD_SUPABASE_SERVICE_KEY=votre_service_role_key_ancien
   NEW_SUPABASE_URL=https://nouveau-projet-id.supabase.co
   NEW_SUPABASE_SERVICE_KEY=votre_service_role_key_nouveau
   ```

### Étape 2 : Créer les tables dans le nouveau projet

1. Ouvrez l'éditeur SQL du **NOUVEAU** projet Supabase
2. Exécutez dans l'ordre :
   - `supabase-schema.sql`
   - `supabase-migration-flyer.sql`
   - `supabase-migration-participants.sql`
   - `supabase-migration-status-bouclee.sql`
   - `supabase-fix-rls-policy.sql`

### Étape 3 : Faire migrer les utilisateurs

**⚠️ IMPORTANT** : Les utilisateurs doivent se connecter dans le nouveau projet AVANT la migration des données.

1. Demandez aux utilisateurs de se connecter dans le nouveau projet avec leurs identifiants
2. OU créez manuellement les comptes utilisateurs dans le nouveau projet

### Étape 4 : Exécuter le script de migration

```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Exécuter le script de migration
node scripts/migrate-data.js
```

Le script va :
- Exporter les données de l'ancien projet
- Créer un mapping automatique des utilisateurs (basé sur l'email)
- Importer les participations avec les nouveaux user_id
- Importer les sélections d'IRIS avec les nouveaux participation_id

## 📋 Méthode manuelle : Migration étape par étape

## Étapes de migration

### Étape 1 : Créer les tables dans le nouveau projet

1. Ouvrez l'éditeur SQL du **NOUVEAU** projet Supabase
2. Exécutez dans l'ordre :
   - `supabase-schema.sql` (crée les tables de base)
   - `supabase-migration-flyer.sql` (ajoute les colonnes flyer)
   - `supabase-migration-participants.sql` (ajoute les colonnes participants)
   - `supabase-migration-status-bouclee.sql` (ajoute le statut 'bouclee')
   - `supabase-fix-rls-policy.sql` (corrige les politiques RLS)

### Étape 2 : Vérifier la structure des tables

Exécutez dans le nouveau projet :

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'france_distri_%';

-- Vérifier les colonnes de france_distri_participations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'france_distri_participations'
ORDER BY ordinal_position;
```

### Étape 3 : Exporter les données de l'ancien projet (si nécessaire)

1. Ouvrez l'éditeur SQL de l'**ANCIEN** projet Supabase
2. Exécutez `scripts/export-data.sql`
3. Copiez les résultats JSON
4. Sauvegardez-les dans un fichier pour référence

### Étape 4 : Migrer les utilisateurs (si nécessaire)

**⚠️ IMPORTANT** : Les `user_id` dans les participations doivent correspondre aux IDs des utilisateurs dans le nouveau projet.

**Option A : Les utilisateurs existent déjà dans le nouveau projet**
- Créez un mapping entre les anciens et nouveaux `user_id`
- Utilisez ce mapping lors de l'import des participations

**Option B : Vous devez créer les utilisateurs dans le nouveau projet**
- Les utilisateurs devront se reconnecter avec leurs identifiants
- Les nouveaux `user_id` seront différents des anciens
- Vous devrez créer un mapping manuel

### Étape 5 : Importer les données

1. Ouvrez l'éditeur SQL du **NOUVEAU** projet Supabase
2. Modifiez `scripts/import-data.sql` avec vos données exportées
3. Exécutez le script d'import

**⚠️ ATTENTION** :
- Les `user_id` doivent être mis à jour pour correspondre aux nouveaux utilisateurs
- Les `participation_id` dans `france_distri_iris_selections` doivent correspondre aux nouveaux IDs de participations

### Étape 6 : Vérifier les données

Exécutez dans le nouveau projet :

```sql
-- Compter les participations
SELECT COUNT(*) FROM france_distri_participations;

-- Compter les sélections d'IRIS
SELECT COUNT(*) FROM france_distri_iris_selections;

-- Vérifier les relations
SELECT 
  p.ville_name,
  p.tournee_date_debut,
  COUNT(DISTINCT p.id) as participations,
  COUNT(isel.id) as total_iris_selections
FROM france_distri_participations p
LEFT JOIN france_distri_iris_selections isel ON p.id = isel.participation_id
GROUP BY p.ville_name, p.tournee_date_debut;
```

## Migration des utilisateurs

### Si vous voulez migrer les utilisateurs existants

Les utilisateurs devront :
1. Se reconnecter avec leurs identifiants (email/mot de passe)
2. Leurs nouveaux `user_id` seront générés automatiquement

**Vous ne pouvez pas migrer directement les utilisateurs** car Supabase ne permet pas d'exporter/importer les mots de passe (pour des raisons de sécurité).

### Solution : Mapping manuel des user_id

Si vous avez peu d'utilisateurs, vous pouvez :
1. Lister les emails des utilisateurs de l'ancien projet
2. Les faire se connecter dans le nouveau projet
3. Créer un mapping entre anciens et nouveaux `user_id`
4. Mettre à jour les `user_id` dans les participations lors de l'import

## Script de migration automatique (optionnel)

Si vous avez beaucoup de données, vous pouvez créer un script Node.js pour automatiser la migration. Voir `scripts/migrate-data.js` (à créer si nécessaire).

## Vérification finale

1. Testez la création d'un nouveau compte
2. Testez la connexion
3. Testez la création d'une participation
4. Vérifiez que les données s'affichent correctement sur la carte

## En cas de problème

1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les politiques RLS dans Supabase
3. Vérifiez que toutes les migrations ont été exécutées
4. Vérifiez que les `user_id` correspondent bien

