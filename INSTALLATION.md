# 📦 Installation - DVD Ripper Node.js v2.2

Guide d'installation après les Sprints 0 et 1.

---

## 🚀 Installation Rapide

### 1. Installer les dépendances

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configuration (optionnel)

```bash
# Frontend - Copier et adapter
cp env.example .env.local

# Backend - Copier et adapter
cp server/env.example server/.env
```

### 3. Lancer l'application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Tester

```bash
# Tests unitaires
npm test

# Coverage
npm run test:coverage
```

---

## 📋 Dépendances Système

### Linux/Mac

```bash
# Seul bc est requis (ffmpeg est embarqué)
sudo apt install bc      # Ubuntu/Debian
brew install bc          # macOS
```

### Windows

```powershell
# ffmpeg et bc sont embarqués, pas d'installation système nécessaire
```

---

## 🔧 Configuration Détaillée

### Frontend (.env.local)

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3001/api

# Mode
VITE_MODE=development

# Debug
VITE_DEBUG=true
```

### Backend (server/.env)

```env
# Port du serveur
PORT=3001

# Environnement
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate limiting
RATE_LIMIT_MAX_GENERAL=60
RATE_LIMIT_MAX_SCAN=10
RATE_LIMIT_MAX_CONVERT=3

# Dossiers autorisés (séparés par virgules)
ALLOWED_ROOTS=/media,/mnt,/home
```

---

## 📦 Nouvelles Dépendances

### Frontend (package.json)

```json
{
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwindcss": "^4.1.18",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "@vitest/coverage-v8": "^2.1.8"
  }
}
```

### Backend (server/package.json)

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "cors": "^2.8.5",
    "fluent-ffmpeg": "^2.1.3",
    "ffmpeg-static": "^5.3.0",
    "ffprobe-static": "^3.1.0",
    "express-rate-limit": "^8.2.1",
    "joi": "^17.13.3"
  }
}
```

---

## 🧪 Tests

### Commandes disponibles

```bash
# Mode watch (développement)
npm test

# UI interactive
npm run test:ui

# Coverage report
npm run test:coverage

# Mode CI (une fois)
npm run test:run
```

### Tests disponibles

- ✅ **56 tests** au total
- ✅ **29 tests** pour formatters
- ✅ **18 tests** pour API client
- ✅ **9 tests** pour Toast component
- ✅ **60%+ coverage** minimum

---

## 🔍 Vérification

### 1. Backend fonctionne

```bash
curl http://localhost:3001/api/check-dependencies
```

Réponse attendue:
```json
{
  "ffmpeg": true,
  "ffprobe": true,
  "bc": true,
  "allInstalled": true,
  "embedded": true
}
```

### 2. Frontend fonctionne

Ouvrir: http://localhost:5173

Vérifier:
- ✅ Interface se charge
- ✅ Pas d'erreur dans la console
- ✅ "État des dépendances" affiche tout en vert

### 3. Tests fonctionnent

```bash
npm test

# Résultat attendu:
# ✓ src/utils/formatters.test.js (29)
# ✓ src/api/client.test.js (18)
# ✓ src/components/common/Toast.test.jsx (9)
# 
# Test Files  3 passed (3)
# Tests  56 passed (56)
```

---

## 🐛 Résolution de Problèmes

### Erreur: Backend non disponible

**Symptôme:** Bannière rouge "Backend non disponible"

**Solution:**
```bash
# Vérifier que le backend tourne
cd server
npm start

# Vérifier le port
lsof -i :3001

# Vérifier les logs
tail -f server/logs/server.log
```

### Erreur: express-rate-limit not found

**Symptôme:** `Cannot find module 'express-rate-limit'`

**Solution:**
```bash
cd server
npm install
```

### Erreur: vitest not found

**Symptôme:** `npm test` échoue

**Solution:**
```bash
npm install
```

### Erreur: Tests timeout

**Symptôme:** Tests dépassent le timeout

**Solution:**
```bash
# Augmenter le timeout dans vitest.config.js
export default defineConfig({
  test: {
    testTimeout: 30000 // 30 secondes
  }
});
```

### Erreur: Permission denied

**Symptôme:** Erreur de permissions sur npm install

**Solution:**
```bash
# Nettoyer les caches
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json

# Réinstaller
npm install
cd server && npm install
```

---

## 📚 Documentation

### Fichiers de documentation

1. **README.md** - Vue d'ensemble
2. **INSTALLATION.md** - Ce fichier
3. **CHANGELOG.md** - Historique des versions
4. **DOCUMENTATION/**
   - CODE_REVIEW.md - Review complète
   - TODO.md - Roadmap
   - SPRINT_0_COMPLETED.md - Sécurité & Performance
   - SPRINT_1_COMPLETED.md - Architecture & UX
   - GUIDE_DEVELOPPEMENT.md - Guide pratique
5. **src/test/README.md** - Guide des tests

---

## 🚀 Prochaines Étapes

Après l'installation:

1. ✅ **Tester l'application** - Scanner un DVD de test
2. ✅ **Lancer les tests** - `npm test` pour vérifier
3. ✅ **Lire la doc** - GUIDE_DEVELOPPEMENT.md
4. ✅ **Contribuer** - Voir TODO.md pour les tâches

---

## 💡 Astuces

### Scripts npm utiles

```bash
# Développement
npm run dev           # Frontend dev server
npm test             # Tests en mode watch

# Production
npm run build        # Build frontend
npm run preview      # Preview du build

# Qualité
npm run lint         # Linter
npm run test:coverage # Coverage report

# Backend
cd server
npm start            # Démarrer serveur
npm run dev          # Serveur avec auto-reload
```

### Commandes Git

```bash
# Vérifier les changements
git status
git diff

# Branches
git branch                    # Lister
git checkout -b ma-feature    # Créer

# Commits
git add .
git commit -m "feat: ma feature"
git push
```

---

## 📊 Versions

| Composant | Version |
|-----------|---------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| React | 19.2.0 |
| Vite | 7.2.4 |
| Express | 5.2.1 |
| Vitest | 2.1.8 |
| Joi | 17.13.3 |

---

**Installation terminée !** 🎉

Pour plus d'aide, consultez:
- [GUIDE_DEVELOPPEMENT.md](./DOCUMENTATION/GUIDE_DEVELOPPEMENT.md)
- [Issues GitHub](https://github.com/votre-repo/issues)

---

*Document généré le 30 Décembre 2025*

