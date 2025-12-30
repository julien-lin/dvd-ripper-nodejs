# Architecture Backend - DVD Ripper

## 📂 Structure Actuelle

```
server/
├── src/
│   ├── services/          # Services métier (logique réutilisable)
│   │   ├── ffmpegService.js      ✅ Configuration ffmpeg, conversion, utilities
│   │   ├── securityService.js    ✅ Validation chemins et noms de fichiers
│   │   └── utilsService.js       ✅ Fonctions utilitaires (logs, etc.)
│   ├── controllers/       # Controllers (À CRÉER)
│   └── routes/            # Définitions des routes (À CRÉER)
├── index.js               # Point d'entrée principal (835 lignes - À REFACTORISER)
└── validation.js          # Schémas Joi ✅
```

## ✅ Refactorisation Partielle Complétée

### Services Créés

1. **ffmpegService.js** (195 lignes)
   - Configuration des binaires ffmpeg/ffprobe embarqués
   - `getVideoDuration()` : Obtenir la durée d'une vidéo
   - `formatDuration()` : Format HH:MM:SS
   - `formatBytes()` : Format taille (B, KB, MB, GB)
   - `convertVTS()` : Conversion VTS vers MP4
   - `checkFfmpegDependencies()` : Vérifier les dépendances

2. **securityService.js** (42 lignes)
   - `isPathAllowed()` : Protection Path Traversal
   - `isValidFilename()` : Protection Command Injection
   - `ALLOWED_ROOTS` : Whitelist des chemins autorisés

3. **utilsService.js** (35 lignes)
   - `createLogEntry()` : Création de logs formatés
   - `checkBcAvailability()` : Vérification de bc

### Avantages

- ✅ Code modulaire et réutilisable
- ✅ Tests unitaires facilités
- ✅ Séparation des responsabilités
- ✅ Maintenance simplifiée

## 🔄 Prochaine Étape : Refactorisation Complète

### Phase 2 - Controllers (4-6h)

Créer `src/controllers/conversionController.js` :

```javascript
export async function startConversion(req, res) {
  // Logique de /api/convert
}

export async function getStatus(req, res) {
  // Logique de /api/status
}

export async function stopConversion(req, res) {
  // Logique de /api/stop
}

export async function scanDvd(req, res) {
  // Logique de /api/scan-dvd
}

export async function listDirectory(req, res) {
  // Logique de /api/list-directory
}

export async function checkDependencies(req, res) {
  // Logique de /api/check-dependencies
}
```

### Phase 3 - Routes (1h)

Créer `src/routes/api.js` :

```javascript
import express from 'express';
import * as conversionController from '../controllers/conversionController.js';

const router = express.Router();

router.post('/convert', convertLimiter, validate(convertSchema), conversionController.startConversion);
router.get('/status', conversionController.getStatus);
router.post('/stop', conversionController.stopConversion);
// ... autres routes

export default router;
```

### Phase 4 - Services Métier (6-8h)

#### `src/services/dvdScanService.js`
- Logique de scan DVD
- Détection VTS
- Groupement par titre

#### `src/services/conversionService.js`
- Gestion de l'état de conversion
- Orchestration de la conversion
- Gestion des logs et progression

#### `src/services/filesystemService.js`
- Navigation de dossiers
- Gestion des fichiers/dossiers

### Phase 5 - Refactoriser index.js (2h)

Simplifier `index.js` à ~150 lignes :

```javascript
import express from 'express';
import cors from 'cors';
import apiRoutes from './src/routes/api.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
});
```

## 📊 Impact Attendu

| Métrique | Avant | Après Phase 5 |
|----------|-------|---------------|
| Lignes index.js | 835 | ~150 |
| Nombre de fichiers | 2 | 10+ |
| Taille max fichier | 835 | <200 |
| Testabilité | ❌ Difficile | ✅ Facile |
| Maintenabilité | ❌ Monolithe | ✅ Modulaire |

## 🧪 Tests

Après refactorisation complète, ajouter :

```bash
server/src/
├── services/
│   ├── __tests__/
│   │   ├── ffmpegService.test.js
│   │   ├── securityService.test.js
│   │   ├── conversionService.test.js
│   │   └── dvdScanService.test.js
└── controllers/
    └── __tests__/
        └── conversionController.test.js
```

## 📚 Ressources

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Project Structure](https://github.com/goldbergyoni/nodebestpractices#1-project-structure-practices)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Note**: Cette refactorisation est un travail en cours. Les services essentiels sont créés et fonctionnels. La migration complète vers cette architecture nécessite environ 15-20h de travail supplémentaire.

