# Refonte UX/UI - Page de sélection des IRIS

## Structure proposée

### 1. HEADER DE PROGRESSION (Sticky en haut)
```
┌─────────────────────────────────────────────────────────────┐
│ Choisissez vos secteurs de distribution                     │
│ Sélectionnez au minimum 5 000 logements pour continuer     │
│                                                             │
│ [████████░░░░░░░░░░] 2 830 / 5 000 logements               │
│ Il vous manque encore 2 170 logements                      │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi UX :**
- Objectif clair dès l'arrivée
- Progrès visible en temps réel
- Message orienté action ("Il vous manque encore...")
- Barre de progression = feedback visuel immédiat

### 2. LAYOUT PRINCIPAL (2 colonnes)

#### Colonne gauche (70%) : CARTE
- Carte interactive uniquement
- Pas d'informations superflues
- Focus sur l'exploration visuelle

#### Colonne droite (30%) : PANEL DE SUIVI
```
┌─────────────────────────┐
│ 📊 Votre sélection      │
│                         │
│ Secteurs : 3            │
│ Logements : 2 830       │
│ Coût : 283,00 €         │
│                         │
│ [Liste des secteurs]    │
│                         │
│ ⚠️ Secteurs occupés     │
│ [Liste avec bulles]     │
└─────────────────────────┘
```

**Pourquoi UX :**
- Séparation claire : exploration vs décision
- Toutes les métriques au même endroit
- Secteurs occupés séparés pour éviter confusion

### 3. CTA STICKY (En bas de l'écran)
```
┌─────────────────────────────────────────────────────────────┐
│ [Annuler]  [Continuer - 2 170 logements manquants]          │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi UX :**
- Toujours visible
- Message contextuel sur le bouton
- Désactivé si seuil non atteint

## Composants détaillés

### A. Header de progression

**Composant : `ProgressHeader`**

```tsx
<div style={{
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'var(--bg-accent)',
  borderBottom: '2px solid #353550',
  padding: 'var(--spacing-lg)',
  marginBottom: 'var(--spacing-lg)'
}}>
  <h1>Titre actionnable</h1>
  <p>Sous-titre explicatif</p>
  <ProgressBar />
  <StatusMessage />
</div>
```

**États :**
- En cours : barre orange, message "Il vous manque X logements"
- Atteint : barre verte, message "Objectif atteint ! Vous pouvez continuer"
- Erreur : barre rouge (si date limite dépassée)

### B. Panel de suivi

**Composant : `SelectionPanel`**

Sections :
1. **Métriques principales** (toujours visibles)
2. **Liste des secteurs sélectionnés** (scrollable si nécessaire)
3. **Secteurs occupés** (collapsible)

### C. CTA Sticky

**Composant : `StickyCTA`**

- Position : `position: fixed, bottom: 0`
- Fond : `var(--bg-accent)` avec ombre
- Bouton principal : état dynamique selon progression

## Modifications à implémenter

### 1. Créer le composant ProgressHeader
- Calculer le pourcentage : `(totalLogements / 5000) * 100`
- Afficher barre de progression avec couleur dynamique
- Message contextuel selon état

### 2. Réorganiser le layout
- Passer de grid 2 colonnes à flex avec proportions 70/30
- Carte en colonne gauche
- Panel en colonne droite (sticky si nécessaire)

### 3. Simplifier la carte
- Retirer toutes les infos textuelles de la carte
- Garder uniquement l'interaction visuelle
- Améliorer les états hover/selected

### 4. Créer le composant StickyCTA
- Position fixed en bas
- Message dynamique sur le bouton
- Animation d'apparition

### 5. Améliorer les micro-interactions
- Feedback visuel immédiat sur sélection
- Animation de la barre de progression
- Transitions douces (150-250ms)

## Palette de couleurs pour les états

- **En cours** : Orange (`var(--orange-primary)`)
- **Atteint** : Vert (`#4CAF50`)
- **Erreur/Blocage** : Rouge (`#F44336`)
- **Neutre** : Gris (`var(--text-secondary)`)

## Responsive

- Desktop : Layout 2 colonnes
- Tablet : Layout empilé (header → carte → panel)
- Mobile : Carte pleine largeur, panel en dessous

