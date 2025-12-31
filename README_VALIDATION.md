# Validation automatique des tournées

## Vue d'ensemble

Le système de validation automatique vérifie quotidiennement les tournées qui arrivent à leur date limite (15 jours avant le début) et définit leur statut selon le nombre de participants par secteur.

## Statuts possibles

- **`pending`** : Tournée en attente (par défaut)
- **`confirmed`** : Tournée confirmée (au moins un secteur a 3+ participants)
- **`cancelled`** : Tournée annulée (aucun secteur n'a 3+ participants)
- **`bouclee`** : Tournée bouclée (au moins un secteur a 5 participants)

## Règles de validation

1. **Date limite** : La validation se fait 15 jours avant la date de début de la tournée
2. **Minimum de participants** : Un secteur nécessite au moins 3 participants pour être confirmé
3. **Maximum de participants** : Un secteur est bouclé à 5 participants
4. **Statut de la tournée** :
   - Si au moins un secteur a 5 participants → `bouclee`
   - Sinon, si au moins un secteur a 3+ participants → `confirmed`
   - Sinon → `cancelled`

## Méthodes d'exécution

### 1. Via API Route (recommandé pour production)

Appeler l'endpoint :
```
GET /api/validate-tournees
```

Cette route peut être appelée par :
- Un service de cron job externe (Vercel Cron, GitHub Actions, etc.)
- Un webhook
- Un script automatisé

### 2. Via script Node.js

```bash
# Installer les dépendances si nécessaire
npm install

# Exécuter le script
npx ts-node scripts/validate-tournees.ts
```

### 3. Configuration avec Vercel Cron

Ajouter dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/validate-tournees",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Cela exécutera la validation tous les jours à 2h du matin.

## Migration de la base de données

Avant d'utiliser cette fonctionnalité, assurez-vous que la colonne `status` accepte la valeur `bouclee` :

```sql
ALTER TABLE france_distri_participations
DROP CONSTRAINT IF EXISTS france_distri_participations_status_check;

ALTER TABLE france_distri_participations
ADD CONSTRAINT france_distri_participations_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'bouclee'));
```

## Logs et monitoring

Le script affiche dans la console :
- Les tournées en cours de validation
- Le nombre de participants par secteur
- Le statut final attribué à chaque tournée
- Le nombre total de tournées validées

## Exemple de réponse API

```json
{
  "message": "Validation terminée: 2 tournée(s) validée(s)",
  "validated": 2,
  "results": [
    {
      "ville": "Bordeaux",
      "dateDebut": "15 janvier 2024",
      "status": "confirmed",
      "secteurs": [
        { "code": "IRIS001", "count": 4, "status": "confirmed" },
        { "code": "IRIS002", "count": 2, "status": "insufficient" }
      ]
    }
  ]
}
```

