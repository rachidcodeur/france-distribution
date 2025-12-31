# Instructions pour créer la table des profils utilisateur

## Problème
L'erreur `Could not find the table 'public.france_distri_user_profiles'` indique que la table n'existe pas encore dans votre base de données Supabase.

## Solution : Exécuter la migration SQL

### Étape 1 : Ouvrir l'éditeur SQL de Supabase
1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)

### Étape 2 : Exécuter le script de migration
1. Cliquez sur **New Query**
2. Copiez-collez le contenu complet du fichier `supabase-migration-user-profiles.sql`
3. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)

### Étape 3 : Vérifier que la table a été créée
Exécutez cette requête pour vérifier :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'france_distri_user_profiles';
```

Si la requête retourne une ligne, la table a été créée avec succès.

### Étape 4 : Vérifier les politiques RLS
Vérifiez que les politiques RLS sont bien créées :

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'france_distri_user_profiles';
```

Vous devriez voir 3 politiques :
- `Users can view their own profile` (SELECT)
- `Users can create their own profile` (INSERT)
- `Users can update their own profile` (UPDATE)

## Contenu du script à exécuter

Le script `supabase-migration-user-profiles.sql` contient :
- La création de la table `france_distri_user_profiles`
- Les index pour améliorer les performances
- Les politiques RLS (Row Level Security)
- Le trigger pour mettre à jour automatiquement `updated_at`

Une fois cette migration exécutée, la page des paramètres devrait fonctionner correctement.

