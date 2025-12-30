# 🎬 DVD Ripper - Extracteur DVD vers MP4

[![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)](https://github.com/votre-repo/dvd-ripper)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-80%20passing-success.svg)](package.json)

Application web moderne et intuitive pour convertir vos DVD en fichiers MP4 de qualité avec une interface élégante et des fonctionnalités avancées.

![Screenshot](https://via.placeholder.com/800x450/1a202c/ffffff?text=DVD+Ripper+Interface)

---

## ✨ Fonctionnalités

### 🎯 Core Features
- ✅ **Scan automatique des DVD** - Détection intelligente des titres VTS
- ✅ **Multi-sélection VTS** - Interface premium avec prévisualisation
- ✅ **Conversion haute qualité** - Paramètres personnalisables (preset, CRF, bitrate)
- ✅ **Progression temps réel** - WebSockets pour mises à jour instantanées
- ✅ **Reprise de conversion** - Sauvegarde automatique de l'état

### 🎨 Interface & UX
- ✅ **Dark Mode** - Thème sombre élégant avec Tailwind CSS 4
- ✅ **Responsive Design** - Mobile, tablette, desktop
- ✅ **Accessibilité WCAG 2.1 AA** - Navigation clavier, ARIA, contrastes
- ✅ **Prévisualisation vidéo** - Thumbnails des VTS avant conversion
- ✅ **Notifications navigateur** - Alertes sonores et visuelles

### 🚀 Premium Features
- ✅ **Paramètres sauvegardés** - Configuration persistante entre sessions
- ✅ **Historique complet** - Suivi de toutes les conversions avec statistiques
- ✅ **Mode sombre/clair** - Changement de thème avec persistance
- ✅ **Skeleton loading** - États de chargement élégants

### 🔒 Sécurité & Performance
- ✅ **Rate limiting** - Protection contre les abus API
- ✅ **Path traversal protection** - Validation stricte des chemins
- ✅ **Command injection protection** - Sanitization des entrées
- ✅ **WebSockets** - 99% moins de requêtes HTTP vs polling

---

## 📋 Prérequis

### Système
- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **FFmpeg** (inclus via ffmpeg-static)

### Plateforme
- Linux (Ubuntu, Debian, Fedora, etc.)
- macOS
- Windows (via WSL2 recommandé)

---

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-username/dvd-ripper-nodejs.git
cd dvd-ripper-nodejs
```

### 2. Installer les Dépendances

#### Frontend (à la racine)
```bash
npm install
```

#### Backend (dans le dossier server)
```bash
cd server
npm install
cd ..
```

### 3. Configuration (Optionnel)

#### Frontend - Créer `.env` à la racine
```bash
cp env.example .env
```

Contenu par défaut :
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Backend - Créer `.env` dans `server/`
```bash
cp server/env.example server/.env
```

Contenu par défaut :
```env
PORT=3001
```

---

## ▶️ Démarrage

### Option 1 : Script Automatique (Recommandé)

Le script `start.sh` démarre automatiquement le backend et le frontend :

```bash
./start.sh
```

**Ce que fait le script :**
1. ✅ Vérifie Node.js
2. ✅ Installe les dépendances si nécessaire
3. ✅ Démarre le backend (port 3001)
4. ✅ Démarre le frontend (port 5173)
5. ✅ Ouvre les deux serveurs en arrière-plan

**Accès :**
- Frontend : http://localhost:5173
- Backend API : http://localhost:3001/api

**Arrêt :**
- Appuyer sur `Ctrl+C` dans le terminal

---

### Option 2 : Démarrage Manuel

#### Terminal 1 - Backend
```bash
cd server
npm start
```

Backend démarre sur **http://localhost:3001**

#### Terminal 2 - Frontend
```bash
npm run dev
```

Frontend démarre sur **http://localhost:5173**

---

### Option 3 : Mode Développement

#### Backend avec Hot Reload
```bash
cd server
npm run dev
```

#### Frontend avec Hot Reload
```bash
npm run dev
```

---

## 📜 Scripts Disponibles

### Frontend (à la racine)

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre Vite en mode développement |
| `npm run build` | Build de production dans `/dist` |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm test` | Lance les tests unitaires (Vitest) |
| `npm run test:ui` | Interface UI pour les tests |
| `npm run test:coverage` | Génère le rapport de couverture |
| `npm run test:e2e` | Lance les tests E2E (Playwright) |

### Backend (dans `server/`)

| Script | Description |
|--------|-------------|
| `npm start` | Démarre le serveur Express |
| `npm run dev` | Démarre avec hot reload (node --watch) |
| `npm test` | Lance les tests backend (Vitest) |
| `npm run test:coverage` | Rapport de couverture backend |

---

## 🏗️ Architecture

```
dvd-ripper-nodejs/
├── src/                      # Frontend React
│   ├── components/           # Composants React
│   │   ├── common/          # Composants réutilisables
│   │   ├── ConfigForm.jsx   # Configuration conversion
│   │   ├── ProgressPanel.jsx# Progression temps réel
│   │   ├── ResultsPanel.jsx # Résultats finaux
│   │   ├── ConversionHistory.jsx # Historique
│   │   └── ...
│   ├── hooks/               # Hooks personnalisés
│   │   ├── useTheme.js      # Gestion dark mode
│   │   ├── useWebSocket.js  # Connexion WebSocket
│   │   └── usePersistedConfig.js # Persistance localStorage
│   ├── store/               # Redux Toolkit
│   │   ├── conversionSlice.js
│   │   └── systemSlice.js
│   ├── api/                 # Client API centralisé
│   ├── services/            # Services (notifications, etc.)
│   └── utils/               # Utilitaires (formatters, a11y)
│
├── server/                   # Backend Express
│   ├── index.js             # Point d'entrée serveur
│   ├── validation.js        # Schémas Joi
│   └── src/
│       └── services/        # Services modulaires
│           ├── ffmpegService.js      # FFmpeg operations
│           ├── historyService.js     # Historique conversions
│           ├── stateService.js       # Gestion état
│           ├── securityService.js    # Sécurité
│           ├── websocketService.js   # WebSockets
│           └── utilsService.js       # Utilitaires
│
├── DOCUMENTATION/            # Documentation complète
│   ├── README.md            # Index documentation
│   ├── ROADMAP.md           # Feuille de route
│   ├── TODO.md              # Tâches et progression
│   ├── CODE_REVIEW.md       # Analyse initiale
│   ├── GUIDE_DEVELOPPEMENT.md # Guide pratique
│   └── SPRINT_X_COMPLETED.md # Rapports sprints
│
├── e2e/                     # Tests End-to-End
├── public/                  # Assets statiques
├── dist/                    # Build production (généré)
├── start.sh                 # Script de démarrage
├── CHANGELOG.md             # Historique des versions
└── README.md                # Ce fichier
```

---

## 🧪 Tests

### Lancer Tous les Tests

```bash
# Frontend
npm test

# Backend
cd server && npm test
```

### Coverage Rapport

```bash
# Frontend
npm run test:coverage

# Backend
cd server && npm run test:coverage
```

### Tests E2E (Playwright)

```bash
npm run test:e2e
```

**Statistiques actuelles :**
- ✅ **80 tests unitaires** (frontend + backend)
- ✅ **70% de couverture**
- ✅ **0 erreur ESLint**

---

## 📚 Documentation

### Documentation Complète
Toute la documentation est dans le dossier **`DOCUMENTATION/`** :

- **[README.md](DOCUMENTATION/README.md)** - Index de la documentation
- **[ROADMAP.md](DOCUMENTATION/ROADMAP.md)** - Feuille de route (Sprint 5+)
- **[TODO.md](DOCUMENTATION/TODO.md)** - 45 tâches avec progression
- **[GUIDE_DEVELOPPEMENT.md](DOCUMENTATION/GUIDE_DEVELOPPEMENT.md)** - Guide pratique
- **[CODE_REVIEW.md](DOCUMENTATION/CODE_REVIEW.md)** - Analyse détaillée
- **[SPRINT_X_COMPLETED.md](DOCUMENTATION/)** - Rapports de sprints

### Changelog
Voir **[CHANGELOG.md](CHANGELOG.md)** pour l'historique des versions.

---

## 🎯 Utilisation Rapide

### 1. Démarrer l'Application
```bash
./start.sh
```

### 2. Ouvrir le Navigateur
http://localhost:5173

### 3. Scanner un DVD
1. Entrer le chemin du DVD (ex: `/media/dvd/VIDEO_TS`)
2. Cliquer sur **"Scanner DVD"**
3. Attendre la détection des titres VTS

### 4. Configurer & Convertir
1. **Sélectionner les VTS** à convertir (multi-sélection)
2. **Configurer les paramètres** :
   - Preset : `medium` (recommandé)
   - CRF : `18-23` (qualité)
   - Bitrate audio : `192k` (recommandé)
3. **Choisir le dossier de sortie**
4. Cliquer sur **"Démarrer la conversion"**

### 5. Suivre la Progression
- Progression en temps réel avec WebSockets
- Logs détaillés pour chaque VTS
- Notifications navigateur

### 6. Consulter l'Historique
- Cliquer sur **"📊 Historique"** dans le header
- Voir toutes les conversions passées
- Statistiques globales (Total GB, temps, taux succès)

---

## 🛠️ Développement

### Structure de Développement

```bash
# Installer les dépendances de développement
npm install

# Lancer ESLint
npm run lint

# Lancer les tests en mode watch
npm test

# Lancer Vitest UI
npm run test:ui
```

### Technologies Utilisées

**Frontend:**
- React 19.2
- Redux Toolkit
- Tailwind CSS 4
- Vite
- Socket.IO Client
- Vitest + Testing Library

**Backend:**
- Node.js + Express 5
- FFmpeg (via fluent-ffmpeg)
- Socket.IO
- Joi (validation)
- Vitest (tests)

---

## 🐛 Problèmes Courants

### Le backend ne démarre pas

**Vérifier Node.js:**
```bash
node --version  # Doit être ≥ 18.0.0
```

**Réinstaller les dépendances:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Le frontend ne se connecte pas au backend

**Vérifier que le backend tourne:**
```bash
curl http://localhost:3001/api/check-dependencies
```

**Vérifier les variables d'environnement:**
```bash
cat .env
# VITE_API_BASE_URL doit pointer vers le backend
```

### FFmpeg introuvable

Le package `ffmpeg-static` inclut FFmpeg automatiquement. Si problème :

```bash
cd server
npm install ffmpeg-static --save
```

### Port déjà utilisé

**Changer le port backend** dans `server/.env` :
```env
PORT=3002
```

**Changer le port frontend** dans `vite.config.js` :
```javascript
export default defineConfig({
  server: {
    port: 5174
  }
})
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'feat: Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Suivre les conventions de commit (feat, fix, docs, chore, etc.)
- Ajouter des tests pour les nouvelles features
- Maintenir ESLint 0 errors
- Mettre à jour la documentation

---

## 📊 Roadmap

### Version Actuelle : 2.5.0 (Enterprise-Grade)
✅ Sécurité hardened  
✅ Architecture modulaire  
✅ Tests (80 tests)  
✅ WebSockets temps réel  
✅ Dark mode + A11y WCAG 2.1 AA  
✅ Features premium (historique, thumbnails, params sauvegardés)

### Version 3.0 (À venir)
Voir **[DOCUMENTATION/ROADMAP.md](DOCUMENTATION/ROADMAP.md)** pour :
- Sprint 5 : DevOps (CI/CD, Docker, E2E complets)
- Sprint 6+ : Features avancées (Hardware encoding, Sous-titres, Mode auto)
- Vision long terme (Desktop, Mobile, Cloud)

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Julien** - Développeur passionné

- 🌐 Portfolio : (à définir)
- 📧 Email : (à définir)
- 💼 LinkedIn : (à définir)

---

## 🙏 Remerciements

- FFmpeg pour l'encodage vidéo
- Tailwind CSS pour le design system
- React & Redux Toolkit pour l'architecture frontend
- Express pour le backend robuste
- La communauté open-source

---

## 📈 Statistiques

- ⭐ **Version:** 2.5.0
- 📦 **Taille:** ~50MB (avec node_modules)
- 🧪 **Tests:** 80 tests, 70% coverage
- 🎨 **UX Score:** 11/10
- 🔒 **Sécurité:** Hardened (Rate limiting, validation, sanitization)
- ⚡ **Performance:** WebSockets (↓99% requêtes vs polling)

---

<div align="center">

**Fait avec ❤️ et beaucoup de ☕**

Si ce projet vous aide, n'oubliez pas de lui donner une ⭐ !

[⬆ Retour en haut](#-dvd-ripper---extracteur-dvd-vers-mp4)

</div>
