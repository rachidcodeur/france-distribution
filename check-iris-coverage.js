// Script pour vérifier si toutes les communes avec >= 5000 logements ont des données IRIS

const fs = require('fs');

// Lire les fichiers JSON en gérant les NaN
let communesData, irisData;
try {
  const communesContent = fs.readFileSync('./communes_logements.json', 'utf-8');
  communesData = JSON.parse(communesContent);
} catch (e) {
  console.error('Erreur lors de la lecture de communes_logements.json:', e.message);
  process.exit(1);
}

try {
  const irisContent = fs.readFileSync('./communes_iris_logements.json', 'utf-8')
    .replace(/:\s*NaN\s*([,}])/g, ': null$1'); // Remplacer NaN par null
  irisData = JSON.parse(irisContent);
} catch (e) {
  console.error('Erreur lors de la lecture de communes_iris_logements.json:', e.message);
  process.exit(1);
}

// Normaliser les noms de communes (minuscules, sans accents)
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Filtrer les communes avec >= 5000 logements
const communesFiltrees = communesData.filter(c => {
  const log = typeof c.logements === 'number' 
    ? c.logements 
    : parseFloat(String(c.logements).replace(/\s/g, '').replace(',', '.'));
  return log >= 5000;
});

console.log('📊 Analyse des communes avec >= 5000 logements:');
console.log('   - Total de communes filtrées:', communesFiltrees.length);

// Créer un Set des noms de communes normalisés dans les données IRIS
const communesAvecIris = new Set();
irisData.forEach(item => {
  if (item.ville) {
    communesAvecIris.add(normalizeName(item.ville));
  }
});

console.log('   - Communes avec données IRIS dans le fichier:', communesAvecIris.size);

// Vérifier quelles communes filtrées ont des IRIS
const communesFiltreesAvecIris = communesFiltrees.filter(c => 
  communesAvecIris.has(normalizeName(c.ville))
);
const communesFiltreesSansIris = communesFiltrees.filter(c => 
  !communesAvecIris.has(normalizeName(c.ville))
);

console.log('');
console.log('✅ Communes filtrées AVEC données IRIS:', communesFiltreesAvecIris.length);
console.log('❌ Communes filtrées SANS données IRIS:', communesFiltreesSansIris.length);

if (communesFiltreesSansIris.length > 0) {
  console.log('');
  console.log('⚠️  Exemples de communes sans IRIS (10 premières):');
  communesFiltreesSansIris.slice(0, 10).forEach(c => {
    console.log('   -', c.ville, '(' + c.logements + ' logements, ' + c.departement + ')');
  });
}

const taux = (communesFiltreesAvecIris.length / communesFiltrees.length * 100).toFixed(1);
console.log('');
console.log('📈 Taux de couverture:', taux + '%');

// Vérifier le nombre d'IRIS par commune
const irisParCommune = {};
irisData.forEach(item => {
  if (item.ville && item.iris) {
    const nomNormalise = normalizeName(item.ville);
    if (!irisParCommune[nomNormalise]) {
      irisParCommune[nomNormalise] = 0;
    }
    irisParCommune[nomNormalise] += item.iris.length;
  }
});

const communesAvecIrisDetails = communesFiltrees.filter(c => 
  irisParCommune[normalizeName(c.ville)]
);

if (communesAvecIrisDetails.length > 0) {
  const nbIrisMoyen = communesAvecIrisDetails.reduce((sum, c) => 
    sum + (irisParCommune[normalizeName(c.ville)] || 0), 0
  ) / communesAvecIrisDetails.length;
  console.log('   - Nombre moyen d\'IRIS par commune:', nbIrisMoyen.toFixed(1));
  
  // Trouver les communes avec le plus et le moins d'IRIS
  const communesAvecNbIris = communesAvecIrisDetails.map(c => ({
    nom: c.ville,
    nbIris: irisParCommune[normalizeName(c.ville)],
    logements: c.logements
  })).sort((a, b) => b.nbIris - a.nbIris);
  
  console.log('');
  console.log('🔝 Top 5 communes avec le plus d\'IRIS:');
  communesAvecNbIris.slice(0, 5).forEach(c => {
    console.log('   -', c.nom, ':', c.nbIris, 'IRIS,', c.logements, 'logements');
  });
}

