# 🎬 Interface Web - Extracteur DVD vers MP4

Interface utilisateur moderne et conviviale pour convertir vos DVD en fichiers MP4.

## 📋 Prérequis

### Dépendances système
```bash
sudo apt install bc
```

**Note:** ffmpeg et ffprobe sont **embarqués** dans l'application via les packages npm `ffmpeg-static` et `ffprobe-static`. Vous n'avez **pas besoin** de les installer sur votre système !

### Dépendances Node.js

**Backend (dans le dossier `server/`):**
```bash
cd server
npm install
```

**Frontend (à la racine):**
```bash
npm install
```

## 🚀 Installation complète

1. **Installer les dépendances système:**
```bash
sudo apt install ffmpeg bc
```

2. **Installer les dépendances backend:**
```bash
cd server
npm install
cd ..
```

3. **Installer les dépendances frontend:**
```bash
npm install
```

## ▶️ Utilisation

### 1. Démarrer le serveur backend

Dans un terminal:
```bash
cd server
npm start
```

Le serveur démarre sur `http://localhost:3001`

### 2. Démarrer l'interface frontend

Dans un autre terminal:
```bash
npm run dev
```

L'interface est accessible sur `http://localhost:5173` (ou le port indiqué par Vite)

## 🎯 Fonctionnalités

### Configuration
- ✅ Sélection du chemin DVD (VIDEO_TS)
- ✅ Choix du répertoire de sortie
- ✅ Scan automatique des titres VTS disponibles
- ✅ Sélection des titres à convertir
- ✅ Paramètres de qualité (preset, CRF, bitrate audio)

### Conversion
- ✅ Progression en temps réel
- ✅ Logs détaillés avec timestamps
- ✅ Statistiques par titre (succès/erreurs)
- ✅ Possibilité d'arrêter la conversion
- ✅ Gestion automatique des erreurs DVD

### Résultats
- ✅ Analyse automatique des fichiers convertis
- ✅ Affichage des durées, tailles et bitrates
- ✅ Statistiques globales

## 📁 Structure du projet

```
extract-dvd-linux/
├── server/                 # Backend Node.js
│   ├── index.js           # Serveur Express + logique ffmpeg
│   └── package.json       # Dépendances backend
├── src/
│   ├── components/
│   │   ├── ConfigForm.jsx     # Formulaire de configuration
│   │   ├── ProgressPanel.jsx  # Panneau de progression
│   │   └── ResultsPanel.jsx   # Panneau des résultats
│   ├── App.jsx            # Composant principal
│   └── main.jsx           # Point d'entrée
└── package.json           # Dépendances frontend
```

## 🔧 Configuration

Les paramètres par défaut peuvent être modifiés dans l'interface:

- **Preset**: slow (qualité max) / medium (équilibré) / fast (rapide)
- **CRF**: 18-23 (18 = excellente qualité)
- **Bitrate audio**: 128k / 192k / 256k / 320k

## 🐛 Résolution de problèmes

### Le backend ne démarre pas
- Vérifiez que le port 3001 n'est pas utilisé
- Vérifiez que toutes les dépendances sont installées: `cd server && npm install`

### Erreur "ffmpeg not found"
- Installez ffmpeg: `sudo apt install ffmpeg`
- Vérifiez avec: `which ffmpeg`

### Le scan ne trouve pas de VTS
- Vérifiez que le chemin DVD est correct
- Le chemin doit pointer vers le dossier VIDEO_TS
- Vérifiez les permissions d'accès au dossier

### La conversion échoue
- Consultez les logs dans l'interface
- Vérifiez l'espace disque disponible
- Vérifiez que le DVD n'est pas endommagé

## 📝 Notes

- Le backend utilise `fluent-ffmpeg` pour exécuter les conversions
- Les logs sont affichés en temps réel dans l'interface
- La conversion peut être arrêtée à tout moment
- Les fichiers temporaires sont nettoyés automatiquement en cas d'erreur

## 🔄 Différences avec les scripts bash

L'interface web reprend toute la logique des scripts bash mais avec:
- ✅ Interface graphique moderne
- ✅ Progression en temps réel
- ✅ Gestion des erreurs améliorée
- ✅ Pas besoin de modifier les scripts pour changer les paramètres

