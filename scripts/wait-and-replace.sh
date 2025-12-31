#!/bin/bash

# Script pour attendre la fin du script d'enrichissement et remplacer le fichier

cd "/Users/rachdev/Desktop/Projets Cursor/France Distribution"

echo "⏳ Attente de la fin du script d'enrichissement..."

# Attendre que le processus se termine
while ps aux | grep -i "enrich-all-communes-v3.js" | grep -v grep > /dev/null; do
  sleep 5
  echo "   Script toujours en cours..."
done

echo "✅ Script terminé !"

# Attendre un peu pour que le fichier soit complètement écrit
sleep 2

# Vérifier que le fichier enrichi existe
if [ -f "communes_logements_enriched.json" ]; then
  echo "📋 Sauvegarde de l'ancien fichier..."
  cp communes_logements.json communes_logements.json.backup.$(date +%Y%m%d_%H%M%S)
  
  echo "🔄 Remplacement du fichier..."
  cp communes_logements_enriched.json communes_logements.json
  
  echo "✅ Fichier remplacé avec succès !"
  echo ""
  echo "📊 Statistiques du nouveau fichier :"
  echo "   - Total de communes: $(grep -c '"ville"' communes_logements.json)"
  echo "   - Communes avec département: $(grep -c '"departement"' communes_logements.json | head -1)"
  echo "   - Communes 'Non spécifié': $(grep -c '"Non spécifié"' communes_logements.json | head -1)"
else
  echo "❌ Erreur: Le fichier enrichi n'existe pas !"
  exit 1
fi

