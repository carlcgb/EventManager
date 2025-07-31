# 🤠 Système de Gestion d'Événements

Application web complète pour la création et la gestion d'événements avec personnalisation avancée et fonctionnalités sociales interactives.

## 📋 Aperçu

Cette application permet aux utilisateurs de créer, gérer et publier des événements avec un système d'authentification robuste, une intégration calendrier bidirectionnelle, et des fonctionnalités sociales gamifiées. Le tout dans un thème western/cowboy unique inspiré de Sam Hébert, humoriste.

## ✨ Fonctionnalités Principales

### 🎫 Gestion d'Événements
- **Création d'événements** avec titre, description, date, et lieu
- **Modification en temps réel** avec formulaire de validation
- **Statuts d'événements** : Brouillon → En attente → Publié
- **Suppression sécurisée** avec confirmation

### 📅 Intégration Calendrier
- **Google Calendar OAuth** avec synchronisation bidirectionnelle
- **Ajout automatique** d'événements au calendrier personnel
- **Mise à jour en temps réel** des modifications
- **Emoji cowboy** (🤠) dans les titres d'événements synchronisés

### 🗺️ Intégration Géographique
- **Google Maps** pour les suggestions d'adresses
- **Données de fallback** spécialisées pour le Québec
- **Bouton "Itinéraire"** direct vers Google Maps
- **Géolocalisation automatique** des lieux

### 👥 Fonctionnalités Sociales
- **Système de badges** avec récompenses d'engagement
- **Partage social** sur différentes plateformes
- **Statistiques utilisateur** (événements créés, partages, score social)
- **Notifications en temps réel** via WebSocket

### 🔐 Authentification
- **Replit Auth** avec OpenID Connect
- **Sessions sécurisées** avec PostgreSQL
- **Gestion des tokens** avec rafraîchissement automatique
- **Protection des routes** côté serveur et client

## 🛠️ Architecture Technique

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le développement et la compilation
- **Wouter** pour le routage côté client
- **TanStack Query** pour la gestion d'état serveur
- **shadcn/ui** avec composants Radix UI
- **Tailwind CSS** avec thème western personnalisé

### Backend
- **Node.js** avec Express.js
- **TypeScript** avec modules ES
- **API REST** avec validation Zod
- **WebSocket** pour les notifications temps réel

### Base de Données
- **PostgreSQL** (Neon serverless)
- **Drizzle ORM** avec schémas TypeScript
- **Migrations automatisées** via Drizzle Kit
- **Pool de connexions** optimisé

### Externes Intégrations
- **Google Calendar API** avec OAuth2
- **Google Maps API** pour géolocalisation
- **Replit Authentication** pour l'authentification utilisateur

## 🚀 Installation et Déploiement

### Prérequis
- Node.js 18+
- Base de données PostgreSQL
- Comptes Google Cloud Platform et Replit

### Variables d'Environnement
```bash
# Base de données
DATABASE_URL=postgresql://...

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_ID=your_calendar_id

# Firebase (optionnel)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Commandes de Développement
```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Synchronisation base de données
npm run db:push

# Compilation pour production
npm run build
```

### Structure du Projet
```
├── client/          # Application React frontend
├── server/          # Serveur Express backend  
├── shared/          # Schémas et types partagés
├── components.json  # Configuration shadcn/ui
├── drizzle.config.ts# Configuration Drizzle ORM
└── README.md        # Documentation
```

## 🎨 Design et UX

### Thème Western
- **Palette de couleurs** terre et cuir
- **Typographie** inspirée du Far West
- **Animations** fluides avec Framer Motion
- **Interface responsive** mobile-first

### Expérience Utilisateur
- **Formulaires intuitifs** avec validation en temps réel
- **Notifications toast** pour les actions utilisateur
- **États de chargement** avec squelettes
- **Navigation cohérente** avec boutons d'action

## 📊 Fonctionnalités Avancées

### Système de Badges
- **Premier Événement** : Créer votre premier événement
- **Maître des Événements** : Créer 10+ événements
- **Papillon Social** : Partager 5+ événements
- **Influenceur** : Atteindre 100+ points sociaux

### Analytics
- **Statistiques mensuelles** des événements
- **Taux de publication** des événements
- **Métriques d'engagement** social
- **Suivi des performances** utilisateur

## 🔧 Configuration Google Calendar

1. Créer un projet Google Cloud Platform
2. Activer l'API Google Calendar
3. Configurer l'écran de consentement OAuth
4. Créer des identifiants OAuth 2.0
5. Ajouter les domaines autorisés (replit.app)

## 🌐 Déploiement

L'application est optimisée pour le déploiement sur Replit :
- **Build automatisé** avec Vite et ESBuild
- **Variables d'environnement** sécurisées
- **Base de données** PostgreSQL hébergée
- **SSL/TLS** automatique
- **Domaine personnalisé** supporté

## 🤝 Contribution

Cette application a été développée avec une attention particulière aux bonnes pratiques :
- **Code TypeScript** entièrement typé
- **Architecture modulaire** et maintenable
- **Tests de validation** des schémas
- **Documentation** complète du code

## 📝 Licence

Projet développé pour la gestion d'événements avec intégration calendrier et fonctionnalités sociales.

---

Développé avec ❤️ et le thème western de Sam Hébert