// Fichier de données des villes avec tournées disponibles
// Les données sont chargées depuis communes_logements.json

import communesData from '../communes_logements.json'

interface CommuneData {
  ville: string
  logements: number | null
  departement?: string
  region?: string
}

export interface Tournee {
  dateDebut: string
  dateFin: string
  dateLimite: string
  participants: number
  placesDisponibles: number
  status?: 'disponible' | 'bouclee' | 'annulee' | 'expiree'
  month?: number // Mois (1-12) pour faciliter le filtrage
  year?: number // Année pour faciliter le filtrage
}

export interface Ville {
  name: string
  departement: string
  region: string
  logements: string
  tournees: Tournee[]
}

// Mapping des grandes villes vers leur département et région
// Pour les villes non listées, on utilisera des valeurs par défaut
const villeMapping: Record<string, { departement: string; region: string }> = {
  // Nouvelle-Aquitaine
  'Bordeaux': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Pessac': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Mérignac': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Bayonne': { departement: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  'Pau': { departement: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  'La Rochelle': { departement: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  'Poitiers': { departement: 'Vienne', region: 'Nouvelle-Aquitaine' },
  'Limoges': { departement: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  'Angoulême': { departement: 'Charente', region: 'Nouvelle-Aquitaine' },
  'Niort': { departement: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  'Agen': { departement: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  'Périgueux': { departement: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  'Biarritz': { departement: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  'Anglet': { departement: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
  'Talence': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Villenave-d\'Ornon': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Bègles': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Gradignan': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Le Bouscat': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Eysines': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Lormont': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Cenon': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Floirac': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Bruges': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Blanquefort': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Saint-Médard-en-Jalles': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Libourne': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Arcachon': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'La Teste-de-Buch': { departement: 'Gironde', region: 'Nouvelle-Aquitaine' },
  'Bergerac': { departement: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  'Dax': { departement: 'Landes', region: 'Nouvelle-Aquitaine' },
  'Mont-de-Marsan': { departement: 'Landes', region: 'Nouvelle-Aquitaine' },
  'Rochefort': { departement: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  'Royan': { departement: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  'Saintes': { departement: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
  'Cognac': { departement: 'Charente', region: 'Nouvelle-Aquitaine' },
  'Brive-la-Gaillarde': { departement: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  'Tulle': { departement: 'Corrèze', region: 'Nouvelle-Aquitaine' },
  'Guéret': { departement: 'Creuse', region: 'Nouvelle-Aquitaine' },
  'Parthenay': { departement: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  'Bressuire': { departement: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  'Thouars': { departement: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
  'Châtellerault': { departement: 'Vienne', region: 'Nouvelle-Aquitaine' },
  'Chauvigny': { departement: 'Vienne', region: 'Nouvelle-Aquitaine' },
  'Bellac': { departement: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  'Saint-Junien': { departement: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
  'Marmande': { departement: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  'Villeneuve-sur-Lot': { departement: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
  'Sarlat-la-Canéda': { departement: 'Dordogne', region: 'Nouvelle-Aquitaine' },
  
  // Occitanie
  'Toulouse': { departement: 'Haute-Garonne', region: 'Occitanie' },
  'Montpellier': { departement: 'Hérault', region: 'Occitanie' },
  'Nîmes': { departement: 'Gard', region: 'Occitanie' },
  'Perpignan': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Béziers': { departement: 'Hérault', region: 'Occitanie' },
  'Narbonne': { departement: 'Aude', region: 'Occitanie' },
  'Albi': { departement: 'Tarn', region: 'Occitanie' },
  'Carcassonne': { departement: 'Aude', region: 'Occitanie' },
  'Tarbes': { departement: 'Hautes-Pyrénées', region: 'Occitanie' },
  'Castres': { departement: 'Tarn', region: 'Occitanie' },
  'Rodez': { departement: 'Aveyron', region: 'Occitanie' },
  'Millau': { departement: 'Aveyron', region: 'Occitanie' },
  'Mende': { departement: 'Lozère', region: 'Occitanie' },
  'Foix': { departement: 'Ariège', region: 'Occitanie' },
  'Cahors': { departement: 'Lot', region: 'Occitanie' },
  'Figeac': { departement: 'Lot', region: 'Occitanie' },
  'Gourdon': { departement: 'Lot', region: 'Occitanie' },
  'Auch': { departement: 'Gers', region: 'Occitanie' },
  'Condom': { departement: 'Gers', region: 'Occitanie' },
  'Mirande': { departement: 'Gers', region: 'Occitanie' },
  'Montauban': { departement: 'Tarn-et-Garonne', region: 'Occitanie' },
  'Moissac': { departement: 'Tarn-et-Garonne', region: 'Occitanie' },
  'Pamiers': { departement: 'Ariège', region: 'Occitanie' },
  'Saint-Girons': { departement: 'Ariège', region: 'Occitanie' },
  'Lourdes': { departement: 'Hautes-Pyrénées', region: 'Occitanie' },
  'Lannemezan': { departement: 'Hautes-Pyrénées', region: 'Occitanie' },
  'Bagnères-de-Bigorre': { departement: 'Hautes-Pyrénées', region: 'Occitanie' },
  'Mazamet': { departement: 'Tarn', region: 'Occitanie' },
  'Gaillac': { departement: 'Tarn', region: 'Occitanie' },
  'Lavaur': { departement: 'Tarn', region: 'Occitanie' },
  'Carmaux': { departement: 'Tarn', region: 'Occitanie' },
  'Graulhet': { departement: 'Tarn', region: 'Occitanie' },
  'Lunel': { departement: 'Hérault', region: 'Occitanie' },
  'Sète': { departement: 'Hérault', region: 'Occitanie' },
  'Agde': { departement: 'Hérault', region: 'Occitanie' },
  'Lodève': { departement: 'Hérault', region: 'Occitanie' },
  'Bédarieux': { departement: 'Hérault', region: 'Occitanie' },
  'Pézenas': { departement: 'Hérault', region: 'Occitanie' },
  'Frontignan': { departement: 'Hérault', region: 'Occitanie' },
  'Mauguio': { departement: 'Hérault', region: 'Occitanie' },
  'Palavas-les-Flots': { departement: 'Hérault', region: 'Occitanie' },
  'La Grande-Motte': { departement: 'Hérault', region: 'Occitanie' },
  'Le Grau-du-Roi': { departement: 'Gard', region: 'Occitanie' },
  'Alès': { departement: 'Gard', region: 'Occitanie' },
  'Bagnols-sur-Cèze': { departement: 'Gard', region: 'Occitanie' },
  'Uzès': { departement: 'Gard', region: 'Occitanie' },
  'Le Vigan': { departement: 'Gard', region: 'Occitanie' },
  'Vauvert': { departement: 'Gard', region: 'Occitanie' },
  'Beaucaire': { departement: 'Gard', region: 'Occitanie' },
  'Saint-Gilles': { departement: 'Gard', region: 'Occitanie' },
  'Pont-Saint-Esprit': { departement: 'Gard', region: 'Occitanie' },
  'Limoux': { departement: 'Aude', region: 'Occitanie' },
  'Castelnaudary': { departement: 'Aude', region: 'Occitanie' },
  'Lézignan-Corbières': { departement: 'Aude', region: 'Occitanie' },
  'Quillan': { departement: 'Aude', region: 'Occitanie' },
  'Prades': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Céret': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Argelès-sur-Mer': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Canet-en-Roussillon': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Saint-Cyprien': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Collioure': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  'Banyuls-sur-Mer': { departement: 'Pyrénées-Orientales', region: 'Occitanie' },
  
  // Provence-Alpes-Côte d'Azur
  'Marseille': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Nice': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Toulon': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Aix-en-Provence': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Avignon': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Cannes': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Antibes': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Grasse': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Fréjus': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Hyères': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Draguignan': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Brignoles': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'La Seyne-sur-Mer': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'La Valette-du-Var': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Six-Fours-les-Plages': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Ollioules': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Sanary-sur-Mer': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Bandol': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Cogolin': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Grimaud': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Sainte-Maxime': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Saint-Raphaël': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Le Lavandou': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Cavalaire-sur-Mer': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'La Croix-Valmer': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Ramatuelle': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Gassin': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Plan-de-la-Tour': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'La Garde-Freinet': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Le Muy': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Roquebrune-sur-Argens': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Les Arcs': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Le Luc': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Vidauban': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Lorgues': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Flayosc': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Salernes': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Aups': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Bargemon': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Callas': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Montauroux': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Fayence': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Seillans': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Tanneron': { departement: 'Var', region: "Provence-Alpes-Côte d'Azur" },
  'Mandelieu-la-Napoule': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Cagnes-sur-Mer': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Vence': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Saint-Laurent-du-Var': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Villeneuve-Loubet': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Biot': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Valbonne': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Mougins': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Le Cannet': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Juan-les-Pins': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Vallauris': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Golfe-Juan': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'La Roquette-sur-Siagne': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Pégomas': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Auribeau-sur-Siagne': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Théoule-sur-Mer': { departement: 'Alpes-Maritimes', region: "Provence-Alpes-Côte d'Azur" },
  'Arles': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Martigues': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Aubagne': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Istres': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Salon-de-Provence': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Vitrolles': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Miramas': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'La Ciotat': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Port-de-Bouc': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Fos-sur-Mer': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Châteaurenard': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Tarascon': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Saint-Rémy-de-Provence': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Les Baux-de-Provence': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Fontvieille': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Maussane-les-Alpilles': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Paradou': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Eygalières': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Orgon': { departement: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur" },
  'Cavaillon': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Orange': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Carpentras': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Pertuis': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Apt': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'L\'Isle-sur-la-Sorgue': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Bollène': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Vaison-la-Romaine': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Sorgues': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Monteux': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  'Le Pontet': { departement: 'Vaucluse', region: "Provence-Alpes-Côte d'Azur" },
  
  // Auvergne-Rhône-Alpes
  'Lyon': { departement: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  'Saint-Étienne': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  'Grenoble': { departement: 'Isère', region: 'Auvergne-Rhône-Alpes' },
  'Clermont-Ferrand': { departement: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes' },
  'Villeurbanne': { departement: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  'Vénissieux': { departement: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
  'Valence': { departement: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
  'Annecy': { departement: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes' },
  'Chambéry': { departement: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
  'Aix-les-Bains': { departement: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
  'Roanne': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  'Montbrison': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  'Saint-Chamond': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  'Firminy': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  'Rive-de-Gier': { departement: 'Loire', region: 'Auvergne-Rhône-Alpes' },
  
  // Île-de-France
  'Paris': { departement: 'Paris', region: 'Île-de-France' },
  'Boulogne-Billancourt': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Saint-Denis': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Argenteuil': { departement: 'Val-d\'Oise', region: 'Île-de-France' },
  'Montreuil': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Nanterre': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Créteil': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Versailles': { departement: 'Yvelines', region: 'Île-de-France' },
  'Courbevoie': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Vitry-sur-Seine': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Colombes': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Aulnay-sous-Bois': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Asnières-sur-Seine': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Rueil-Malmaison': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Champigny-sur-Marne': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Antony': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Saint-Maur-des-Fossés': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Drancy': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Noisy-le-Grand': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Issy-les-Moulineaux': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Levallois-Perret': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Neuilly-sur-Seine': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Clichy': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Pantin': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Bondy': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Épinay-sur-Seine': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Villeneuve-Saint-Georges': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Ivry-sur-Seine': { departement: 'Val-de-Marne', region: 'Île-de-France' },
  'Sarcelles': { departement: 'Val-d\'Oise', region: 'Île-de-France' },
  'Cergy': { departement: 'Val-d\'Oise', region: 'Île-de-France' },
  'Saint-Ouen': { departement: 'Seine-Saint-Denis', region: 'Île-de-France' },
  'Gennevilliers': { departement: 'Hauts-de-Seine', region: 'Île-de-France' },
  'Les Ulis': { departement: 'Essonne', region: 'Île-de-France' },
  'Évry': { departement: 'Essonne', region: 'Île-de-France' },
  'Corbeil-Essonnes': { departement: 'Essonne', region: 'Île-de-France' },
  'Massy': { departement: 'Essonne', region: 'Île-de-France' },
  'Palaiseau': { departement: 'Essonne', region: 'Île-de-France' },
  
  // Hauts-de-France
  'Lille': { departement: 'Nord', region: 'Hauts-de-France' },
  'Amiens': { departement: 'Somme', region: 'Hauts-de-France' },
  'Roubaix': { departement: 'Nord', region: 'Hauts-de-France' },
  'Tourcoing': { departement: 'Nord', region: 'Hauts-de-France' },
  'Dunkerque': { departement: 'Nord', region: 'Hauts-de-France' },
  'Calais': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Villeneuve-d\'Ascq': { departement: 'Nord', region: 'Hauts-de-France' },
  'Valenciennes': { departement: 'Nord', region: 'Hauts-de-France' },
  'Boulogne-sur-Mer': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Lens': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Arras': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Douai': { departement: 'Nord', region: 'Hauts-de-France' },
  'Wattrelos': { departement: 'Nord', region: 'Hauts-de-France' },
  'Marcq-en-Barœul': { departement: 'Nord', region: 'Hauts-de-France' },
  'Cambrai': { departement: 'Nord', region: 'Hauts-de-France' },
  'Maubeuge': { departement: 'Nord', region: 'Hauts-de-France' },
  'Liévin': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Hénin-Beaumont': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Béthune': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Bruay-la-Buissière': { departement: 'Pas-de-Calais', region: 'Hauts-de-France' },
  'Abbeville': { departement: 'Somme', region: 'Hauts-de-France' },
  'Saint-Quentin': { departement: 'Aisne', region: 'Hauts-de-France' },
  'Beauvais': { departement: 'Oise', region: 'Hauts-de-France' },
  'Compiègne': { departement: 'Oise', region: 'Hauts-de-France' },
  'Creil': { departement: 'Oise', region: 'Hauts-de-France' },
  
  // Normandie
  'Rouen': { departement: 'Seine-Maritime', region: 'Normandie' },
  'Le Havre': { departement: 'Seine-Maritime', region: 'Normandie' },
  'Caen': { departement: 'Calvados', region: 'Normandie' },
  'Cherbourg-en-Cotentin': { departement: 'Manche', region: 'Normandie' },
  'Évreux': { departement: 'Eure', region: 'Normandie' },
  'Dieppe': { departement: 'Seine-Maritime', region: 'Normandie' },
  'Alençon': { departement: 'Orne', region: 'Normandie' },
  'Lisieux': { departement: 'Calvados', region: 'Normandie' },
  'Vernon': { departement: 'Eure', region: 'Normandie' },
  'Saint-Lô': { departement: 'Manche', region: 'Normandie' },
  
  // Bretagne
  'Rennes': { departement: 'Ille-et-Vilaine', region: 'Bretagne' },
  'Brest': { departement: 'Finistère', region: 'Bretagne' },
  'Quimper': { departement: 'Finistère', region: 'Bretagne' },
  'Lorient': { departement: 'Morbihan', region: 'Bretagne' },
  'Vannes': { departement: 'Morbihan', region: 'Bretagne' },
  'Saint-Brieuc': { departement: 'Côtes-d\'Armor', region: 'Bretagne' },
  'Lannion': { departement: 'Côtes-d\'Armor', region: 'Bretagne' },
  'Dinan': { departement: 'Côtes-d\'Armor', region: 'Bretagne' },
  'Fougères': { departement: 'Ille-et-Vilaine', region: 'Bretagne' },
  'Saint-Malo': { departement: 'Ille-et-Vilaine', region: 'Bretagne' },
  
  // Pays de la Loire
  'Nantes': { departement: 'Loire-Atlantique', region: 'Pays de la Loire' },
  'Angers': { departement: 'Maine-et-Loire', region: 'Pays de la Loire' },
  'Le Mans': { departement: 'Sarthe', region: 'Pays de la Loire' },
  'Saint-Nazaire': { departement: 'Loire-Atlantique', region: 'Pays de la Loire' },
  'La Roche-sur-Yon': { departement: 'Vendée', region: 'Pays de la Loire' },
  'Cholet': { departement: 'Maine-et-Loire', region: 'Pays de la Loire' },
  'Laval': { departement: 'Mayenne', region: 'Pays de la Loire' },
  
  // Centre-Val de Loire
  'Tours': { departement: 'Indre-et-Loire', region: 'Centre-Val de Loire' },
  'Orléans': { departement: 'Loiret', region: 'Centre-Val de Loire' },
  'Blois': { departement: 'Loir-et-Cher', region: 'Centre-Val de Loire' },
  'Bourges': { departement: 'Cher', region: 'Centre-Val de Loire' },
  'Chartres': { departement: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
  'Châteauroux': { departement: 'Indre', region: 'Centre-Val de Loire' },
  
  // Bourgogne-Franche-Comté
  'Dijon': { departement: 'Côte-d\'Or', region: 'Bourgogne-Franche-Comté' },
  'Besançon': { departement: 'Doubs', region: 'Bourgogne-Franche-Comté' },
  'Belfort': { departement: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté' },
  'Chalon-sur-Saône': { departement: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
  'Nevers': { departement: 'Nièvre', region: 'Bourgogne-Franche-Comté' },
  'Auxerre': { departement: 'Yonne', region: 'Bourgogne-Franche-Comté' },
  'Mâcon': { departement: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
  
  // Grand Est
  'Strasbourg': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Reims': { departement: 'Marne', region: 'Grand Est' },
  'Metz': { departement: 'Moselle', region: 'Grand Est' },
  'Nancy': { departement: 'Meurthe-et-Moselle', region: 'Grand Est' },
  'Mulhouse': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Colmar': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Troyes': { departement: 'Aube', region: 'Grand Est' },
  'Charleville-Mézières': { departement: 'Ardennes', region: 'Grand Est' },
  'Châlons-en-Champagne': { departement: 'Marne', region: 'Grand Est' },
  'Épinal': { departement: 'Vosges', region: 'Grand Est' },
  'Bar-le-Duc': { departement: 'Meuse', region: 'Grand Est' },
  'Verdun': { departement: 'Meuse', region: 'Grand Est' },
  'Thionville': { departement: 'Moselle', region: 'Grand Est' },
  'Forbach': { departement: 'Moselle', region: 'Grand Est' },
  'Sarreguemines': { departement: 'Moselle', region: 'Grand Est' },
  'Haguenau': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Schiltigheim': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Illkirch-Graffenstaden': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Sélestat': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Saverne': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Wissembourg': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Obernai': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Barr': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Molsheim': { departement: 'Bas-Rhin', region: 'Grand Est' },
  'Guebwiller': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Ribeauvillé': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Riquewihr': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Kaysersberg': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Turckheim': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Wintzenheim': { departement: 'Haut-Rhin', region: 'Grand Est' },
  'Eguisheim': { departement: 'Haut-Rhin', region: 'Grand Est' },
  
  // Corse
  'Ajaccio': { departement: 'Corse-du-Sud', region: 'Corse' },
  'Bastia': { departement: 'Haute-Corse', region: 'Corse' },
  'Porto-Vecchio': { departement: 'Corse-du-Sud', region: 'Corse' },
  'Calvi': { departement: 'Haute-Corse', region: 'Corse' },
  'Bonifacio': { departement: 'Corse-du-Sud', region: 'Corse' },
  'Corte': { departement: 'Haute-Corse', region: 'Corse' },
  'Propriano': { departement: 'Corse-du-Sud', region: 'Corse' },
  'Sartène': { departement: 'Corse-du-Sud', region: 'Corse' },
  'L\'Île-Rousse': { departement: 'Haute-Corse', region: 'Corse' },
  'Saint-Florent': { departement: 'Haute-Corse', region: 'Corse' },
}

// Fonction de hachage simple pour générer des valeurs déterministes
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Fonction pour générer une valeur pseudo-aléatoire déterministe entre 0 et max
function deterministicRandom(seed: string, max: number): number {
  const hash = hashString(seed)
  return hash % (max + 1)
}

// Fonction pour formater une date en français
function formatFrenchDate(date: Date): string {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Fonction pour trouver le premier lundi à partir d'une date donnée (inclus)
function getFirstMondayFrom(date: Date): Date {
  const dayOfWeek = date.getDay() // 0 = dimanche, 1 = lundi, etc.
  let daysUntilMonday: number
  
  if (dayOfWeek === 1) {
    // Si c'est déjà lundi, on le prend
    daysUntilMonday = 0
  } else if (dayOfWeek === 0) {
    // Si c'est dimanche, le lundi suivant est dans 1 jour
    daysUntilMonday = 1
  } else {
    // Sinon, on calcule les jours jusqu'au prochain lundi
    daysUntilMonday = 8 - dayOfWeek
  }
  
  const firstMonday = new Date(date)
  firstMonday.setDate(date.getDate() + daysUntilMonday)
  return firstMonday
}

// Fonction pour trouver tous les lundis d'un mois donné (une tournée par semaine)
function getAllMondaysInMonth(year: number, month: number): Date[] {
  const mondays: Date[] = []
  const firstDay = new Date(year, month, 1) // Premier jour du mois
  const lastDay = new Date(year, month + 1, 0) // Dernier jour du mois
  
  // Trouver le premier lundi du mois
  let currentDate = getFirstMondayFrom(firstDay)
  
  // Continuer tant qu'on est dans le même mois
  while (currentDate <= lastDay) {
    mondays.push(new Date(currentDate))
    // Passer au lundi suivant
    currentDate.setDate(currentDate.getDate() + 7)
  }
  
  return mondays
}

// Fonction pour générer les tournées mensuelles pour une ville
// Génère les tournées pour les 24 prochains mois (2 ans) pour couvrir tous les cas
function generateTournees(villeName: string): Tournee[] {
  const tournees: Tournee[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11
  
  // Générer les tournées pour les 24 prochains mois à partir du mois actuel
  for (let i = 0; i < 24; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() // 0-11
    
    const mondays = getAllMondaysInMonth(year, month)
    
    mondays.forEach((monday, index) => {
      // Date de début : le lundi
      const dateDebut = new Date(monday)
      // Date de fin : 7 jours après (le lundi suivant)
      const dateFin = new Date(monday)
      dateFin.setDate(dateFin.getDate() + 7)
      // Date limite : 15 jours avant la date de début
      const dateLimite = new Date(monday)
      dateLimite.setDate(dateLimite.getDate() - 15)
      
      // Générer des participants de manière déterministe
      const seed = `${villeName}-${year}-${month}-${index}`
      const participants = deterministicRandom(seed, 2) // 0-2 participants
      // Par défaut, toutes les tournées ont 5 places disponibles
      // Plus tard, on enregistrera les participations et on fera fonctionner le décompte
      const placesDisponibles = 5
      
      tournees.push({
        dateDebut: formatFrenchDate(dateDebut),
        dateFin: formatFrenchDate(dateFin),
        dateLimite: formatFrenchDate(dateLimite),
        participants,
        placesDisponibles,
        month: month + 1, // Mois 1-12
        year: year
      })
    })
  }
  
  return tournees
}

// Fonction pour formater le nombre de logements
function formatLogements(logements: number | null | undefined): string {
  if (logements === null || logements === undefined || isNaN(logements)) {
    return '0'
  }
  if (logements >= 1000) {
    return Math.round(logements).toLocaleString('fr-FR').replace(/\s/g, ' ')
  }
  return Math.round(logements).toString()
}

// Fonction pour normaliser un nom de ville (enlever accents, mettre en minuscules)
function normalizeVilleName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Fonction pour vérifier si une commune correspond à une ville du mapping
function isCommuneInMapping(communeName: string): boolean {
  // Vérification exacte d'abord
  if (villeMapping.hasOwnProperty(communeName)) {
    return true
  }
  
  // Normaliser le nom de la commune
  const normalizedCommune = normalizeVilleName(communeName)
  
  // Vérifier si une ville du mapping correspond (exact ou commence par)
  for (const villeKey in villeMapping) {
    const normalizedVille = normalizeVilleName(villeKey)
    
    // Correspondance exacte normalisée
    if (normalizedCommune === normalizedVille) {
      return true
    }
    
    // Correspondance si la commune commence par le nom de la ville (pour les arrondissements)
    // Ex: "Lyon 1er Arrondissement" commence par "Lyon"
    if (normalizedCommune.startsWith(normalizedVille + ' ')) {
      return true
    }
  }
  
  return false
}

// Fonction pour obtenir le département et la région d'une ville
function getVilleInfo(communeName: string): { departement: string; region: string } {
  // Vérification exacte d'abord
  if (villeMapping.hasOwnProperty(communeName)) {
    return villeMapping[communeName]
  }
  
  // Normaliser le nom de la commune
  const normalizedCommune = normalizeVilleName(communeName)
  
  // Chercher dans le mapping avec matching flexible
  for (const villeKey in villeMapping) {
    const normalizedVille = normalizeVilleName(villeKey)
    
    // Correspondance exacte normalisée
    if (normalizedCommune === normalizedVille) {
      return villeMapping[villeKey]
    }
    
    // Correspondance si la commune commence par le nom de la ville (pour les arrondissements)
    if (normalizedCommune.startsWith(normalizedVille + ' ')) {
      return villeMapping[villeKey]
    }
  }
  
  return { 
    departement: 'Non spécifié', 
    region: 'Non spécifiée' 
  }
}

// Fonction pour obtenir le nom de base de la ville (sans arrondissement)
function getBaseVilleName(communeName: string): string {
  // Si c'est une correspondance exacte dans le mapping, retourner tel quel
  if (villeMapping.hasOwnProperty(communeName)) {
    return communeName
  }
  
  // Normaliser le nom de la commune
  const normalizedCommune = normalizeVilleName(communeName)
  
  // Chercher dans le mapping avec matching flexible
  for (const villeKey in villeMapping) {
    const normalizedVille = normalizeVilleName(villeKey)
    
    // Correspondance exacte normalisée
    if (normalizedCommune === normalizedVille) {
      return villeKey
    }
    
    // Correspondance si la commune commence par le nom de la ville (pour les arrondissements)
    if (normalizedCommune.startsWith(normalizedVille + ' ')) {
      return villeKey
    }
  }
  
  return communeName
}

// Fonction pour déterminer le département à partir du nom de la commune
// En utilisant une API publique (OpenDataSoft)
async function fetchDepartementFromAPI(communeName: string): Promise<{ departement: string; region: string } | null> {
  try {
    const response = await fetch(
      `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-france-commune/records?where=com_name%20like%20%22${encodeURIComponent(communeName)}%22&limit=1`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data.results && data.results.length > 0) {
      const commune = data.results[0].record.fields
      return {
        departement: commune.dep_name || 'Non spécifié',
        region: commune.reg_name || 'Non spécifiée'
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du département pour ${communeName}:`, error)
  }
  return null
}

// Fonction pour déterminer le département à partir du nom de la commune
function getDepartementFromCommune(communeData: CommuneData): { departement: string; region: string } {
  // Si le fichier JSON contient déjà le département et la région, les utiliser
  if (communeData.departement && communeData.region && 
      communeData.departement !== 'Non spécifié' && communeData.region !== 'Non spécifiée') {
    return {
      departement: communeData.departement,
      region: communeData.region
    }
  }
  
  // Sinon, vérifier si la commune est dans le mapping manuel
  const mappedInfo = getVilleInfo(communeData.ville)
  if (mappedInfo.departement !== 'Non spécifié') {
    return mappedInfo
  }
  
  // Si pas trouvé, utiliser une valeur par défaut
  return {
    departement: communeData.departement || 'Non spécifié',
    region: communeData.region || 'Non spécifiée'
  }
}

// Inclure uniquement les communes avec au moins 5000 logements (minimum requis pour valider une participation)
// Les communes sans département dans le mapping seront quand même incluses si elles ont assez de logements
const villes: Ville[] = (communesData as CommuneData[])
  .filter(commune => {
    // Filtrer les communes avec au moins 5000 logements
    const logements = typeof commune.logements === 'number' ? commune.logements : parseFloat(String(commune.logements).replace(/\s/g, '').replace(',', '.'))
    return !isNaN(logements) && logements >= 5000
  })
  .map(commune => {
    const info = getDepartementFromCommune(commune)
    // Utiliser le nom de la commune tel quel (sans transformation)
    const baseVilleName = commune.ville
    return {
      name: baseVilleName,
      departement: info.departement,
      region: info.region,
      logements: formatLogements(commune.logements),
      tournees: generateTournees(baseVilleName),
    }
  })
  // Grouper par nom de base pour éviter les doublons (ex: plusieurs arrondissements de Lyon)
  .reduce((acc, ville) => {
    const existing = acc.find(v => v.name === ville.name)
    if (existing) {
      // Si la ville existe déjà, additionner les logements
      const existingLogements = parseFloat(existing.logements.replace(/\s/g, '').replace(',', '.'))
      const newLogements = parseFloat(ville.logements.replace(/\s/g, '').replace(',', '.'))
      const totalLogements = existingLogements + newLogements
      existing.logements = formatLogements(totalLogements)
    } else {
      acc.push(ville)
    }
    return acc
  }, [] as Ville[])
  // Filtrer à nouveau après le groupement pour s'assurer que le total est >= 5000
  .filter(ville => {
    const logements = parseFloat(ville.logements.replace(/\s/g, '').replace(',', '.'))
    return !isNaN(logements) && logements >= 5000
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export default villes
