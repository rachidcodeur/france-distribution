# Instructions pour enrichir toutes les communes avec départements et régions

## Objectif
Enrichir le fichier `communes_logements.json` avec les départements et régions pour que **toutes les 32 721 communes** soient visibles dans les filtres de la page des tournées.

## Étapes

### 1. Exécuter le script d'enrichissement

```bash
cd scripts
node enrich-all-communes.js
```

**Durée estimée :** 5-10 minutes (le script télécharge toutes les communes françaises depuis OpenDataSoft)

### 2. Vérifier le résultat

Le script va :
- Télécharger toutes les communes françaises depuis l'API OpenDataSoft
- Créer un mapping nom de commune → département/région
- Enrichir le fichier `communes_logements.json`
- Sauvegarder le résultat dans `communes_logements_enriched.json`

### 3. Remplacer le fichier original

Une fois le script terminé :

```bash
# Faire une sauvegarde de l'ancien fichier (optionnel)
cp communes_logements.json communes_logements.json.backup

# Remplacer par le fichier enrichi
cp communes_logements_enriched.json communes_logements.json
```

### 4. Redémarrer l'application

```bash
npm run dev
```

## Résultat attendu

Après l'enrichissement :
- ✅ Toutes les 32 721 communes seront visibles dans les filtres
- ✅ Toutes les communes auront leur département et région corrects
- ✅ Vous pourrez sélectionner n'importe quelle commune et voir ses secteurs IRIS

## Notes importantes

- Le script crée un cache (`communes_departement_mapping.json`) pour éviter de retélécharger les données
- Si le script échoue, vous pouvez le relancer : il utilisera le cache
- Les communes non trouvées dans l'API auront "Non spécifié" comme département (elles seront quand même incluses)

## Dépannage

Si certaines communes ne sont pas trouvées :
1. Vérifiez les logs du script pour voir quelles communes posent problème
2. Le script affiche les 10 premières communes non trouvées pour debug
3. Ces communes seront quand même incluses avec "Non spécifié" comme département

