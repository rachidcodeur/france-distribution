const fs = require('fs');
const path = require('path');

// Lire les deux fichiers JSON
const communesLogementsPath = path.join(__dirname, '..', 'communes_logements.json');
const communesIrisLogementsPath = path.join(__dirname, '..', 'communes_iris_logements.json');

console.log('📖 Lecture des fichiers JSON...');
const communesLogementsContent = fs.readFileSync(communesLogementsPath, 'utf-8');
const communesIrisLogementsContent = fs.readFileSync(communesIrisLogementsPath, 'utf-8');

// Nettoyer les NaN avant de parser
const cleanedCommunesLogements = communesLogementsContent.replace(/:\s*NaN\s*([,\}])/g, ': null$1');
const cleanedCommunesIrisLogements = communesIrisLogementsContent.replace(/:\s*NaN\s*([,\}])/g, ': null$1');

const communesLogements = JSON.parse(cleanedCommunesLogements);
const communesIrisLogements = JSON.parse(cleanedCommunesIrisLogements);

console.log(`✅ ${communesLogements.length} communes dans communes_logements.json`);
console.log(`✅ ${communesIrisLogements.length} communes dans communes_iris_logements.json`);

// Créer un index des données IRIS par nom de ville (normalisé)
const irisDataByVille = new Map();
communesIrisLogements.forEach(commune => {
  const villeKey = commune.ville.toLowerCase().trim();
  irisDataByVille.set(villeKey, commune);
});

let updatedCount = 0;
let parisTotal = 0;

// Parcourir communes_logements.json et mettre à jour les logements null
communesLogements.forEach((commune, index) => {
  if (commune.logements === null || commune.logements === undefined) {
    const villeKey = commune.ville.toLowerCase().trim();
    const irisData = irisDataByVille.get(villeKey);
    
    if (irisData && irisData.iris && Array.isArray(irisData.iris)) {
      // Calculer la somme des logements_iris
      const totalLogements = irisData.iris.reduce((sum, iris) => {
        const logements = iris.logements_iris;
        if (logements !== null && logements !== undefined && !isNaN(logements)) {
          return sum + logements;
        }
        return sum;
      }, 0);
      
      if (totalLogements > 0) {
        commune.logements = totalLogements;
        updatedCount++;
        
        // Compter pour Paris
        if (commune.ville.toLowerCase().includes('paris') && commune.ville.toLowerCase().includes('arrondissement')) {
          parisTotal += totalLogements;
          console.log(`  ✅ ${commune.ville}: ${Math.round(totalLogements).toLocaleString('fr-FR')} logements`);
        }
      }
    }
  }
});

console.log(`\n📊 Résumé:`);
console.log(`  - ${updatedCount} communes mises à jour`);
if (parisTotal > 0) {
  console.log(`  - Total Paris (tous arrondissements): ${Math.round(parisTotal).toLocaleString('fr-FR')} logements`);
}

// Sauvegarder le fichier mis à jour
console.log('\n💾 Sauvegarde de communes_logements.json...');
fs.writeFileSync(communesLogementsPath, JSON.stringify(communesLogements, null, 2), 'utf-8');
console.log('✅ Fichier sauvegardé avec succès!');

