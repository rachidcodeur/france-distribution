# Configuration Supabase pour France Distribution

## Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et les clés API

### 2. Configurer les variables d'environnement

Le fichier `.env.local` doit contenir :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### 3. Créer les tables dans Supabase

1. Allez dans l'éditeur SQL de Supabase
2. Exécutez le contenu du fichier `supabase-schema.sql`
3. Vérifiez que les tables suivantes ont été créées :
   - `france_distri_participations`
   - `france_distri_iris_selections`

### 4. Vérifier les politiques RLS

Les politiques Row Level Security (RLS) sont configurées pour :
- Les utilisateurs peuvent voir et créer leurs propres participations
- Tout le monde peut voir les comptages d'IRIS (pour afficher sur la carte)

### 5. Tester l'authentification

1. Lancez l'application : `npm run dev`
2. Allez sur une page de sélection d'IRIS
3. Sélectionnez des IRIS et cliquez sur "Confirmer la sélection"
4. Un modal d'authentification devrait apparaître si vous n'êtes pas connecté

## Structure des tables

### `france_distri_participations`
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence à auth.users)
- `ville_name` : TEXT
- `tournee_date_debut` : TEXT
- `tournee_date_fin` : TEXT
- `tournee_index` : INTEGER
- `total_logements` : INTEGER
- `cout_distribution` : DECIMAL(10, 2)
- `status` : TEXT ('pending', 'confirmed', 'cancelled')
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

### `france_distri_iris_selections`
- `id` : UUID (clé primaire)
- `participation_id` : UUID (référence à france_distri_participations)
- `iris_code` : TEXT
- `iris_name` : TEXT
- `logements` : INTEGER (nullable)
- `created_at` : TIMESTAMP

## Fonctionnalités

- **Authentification** : Création de compte et connexion via Supabase Auth
- **Enregistrement des sélections** : Les sélections d'IRIS sont enregistrées dans Supabase
- **Comptage des sélections** : Affichage du nombre de personnes ayant sélectionné chaque IRIS sur la carte
- **Bulles orange** : Les IRIS avec des sélections affichent une bulle orange avec le nombre de sélections

## Notes importantes

- Toutes les entités Supabase sont préfixées par `france_distri_`
- Minimum 3 personnes et maximum 5 personnes par IRIS pour confirmer une distribution
- Les bulles sur la carte indiquent :
  - Le nombre de personnes ayant sélectionné l'IRIS
  - ✅ si >= 3 personnes (minimum atteint)
  - (complet) si >= 5 personnes (maximum atteint)

