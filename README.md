# France Distribution - Site Web (Dark Mode)

Site web professionnel pour France Distribution, service de distribution de flyers à Bordeaux.

## 🎨 Charte Graphique - Dark Mode

Le site utilise un design dark mode moderne avec :
- **Couleurs principales** : Orange (#EA8940, #EC7744) pour les CTA et accents
- **Fonds sombres** : #191827 (principal), #131214 (secondaire), #1F2E4E (accent)
- **Texte** : Blanc (#FFFFFF), Gris clair (#D6D6E0), Gris foncé (#9A9AAF)
- **Polices** : Montserrat (titres) et Inter (texte)
- **Style** : Moderne, minimaliste, professionnel, dark mode

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Lancer le serveur de développement :
```bash
npm run dev
```

3. Ouvrir [https://france-distribution-flyers.fr](https://france-distribution-flyers.fr) dans votre navigateur

## 📁 Structure du Projet

```
├── app/
│   ├── layout.tsx      # Layout principal avec fonts
│   ├── page.tsx        # Page d'accueil
│   └── globals.css     # Styles globaux (dark mode)
├── components/
│   ├── Header.tsx      # Header avec navigation
│   ├── Hero.tsx        # Section héros
│   ├── Services.tsx    # Section services
│   ├── Pricing.tsx     # Section tarifs
│   ├── FAQ.tsx         # Section FAQ (accordéon)
│   ├── Contact.tsx     # Section contact (formulaire)
│   ├── Footer.tsx      # Footer
│   └── GSAPAnimations.tsx # Animations GSAP
├── next.config.js      # Configuration Next.js
├── package.json        # Dépendances
└── tsconfig.json       # Configuration TypeScript
```

## ✨ Fonctionnalités

- **Dark Mode** : Design sombre avec palette orange
- **Animations GSAP** : Animations fluides au scroll et au hover
- **Design responsive** : Adapté mobile, tablette et desktop
- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique pour plus de sécurité
- **Composants modulaires** : Architecture React propre

## 🎯 Technologies

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **GSAP 3.12.5** (animations)
- **Google Fonts** (Montserrat, Inter)

## 📱 Responsive

Le site est entièrement responsive avec des breakpoints à :
- Desktop : 1024px+
- Tablet : 768px - 1024px
- Mobile : < 768px

## 🔧 Scripts Disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Compile l'application pour la production
- `npm run start` : Lance le serveur de production
- `npm run lint` : Vérifie le code avec ESLint

## 🎨 Personnalisation

Toutes les couleurs, espacements et typographies sont définis dans `app/globals.css` via des variables CSS pour faciliter la personnalisation.

### Variables principales :
- `--orange-primary` : #EA8940
- `--orange-secondary` : #EC7744
- `--bg-primary` : #191827
- `--bg-secondary` : #131214
- `--bg-accent` : #1F2E4E

## 📄 Licence

MIT

## 🚧 Prochaines Étapes

- Intégration backend (API routes Next.js)
- Base de données pour les formulaires
- Authentification utilisateur
- Dashboard administrateur
