# 🚀 Guide de démarrage rapide

## Installation rapide

```bash
cd /home/julien/Bureau/extract-dvd-linux
chmod +x *.sh
```

## Utilisation en 3 étapes

### 1️⃣ Vérifier l'environnement

```bash
./check_env.sh
```

Si tout est ✓ (vert), passez à l'étape suivante.

### 2️⃣ Lancer la conversion

```bash
./convert_dvd.sh
```

Le script va :
- Scanner automatiquement tous les titres VTS du DVD
- Convertir chaque titre en MP4 avec gestion des erreurs
- Créer un fichier log détaillé
- Afficher les statistiques finales

### 3️⃣ Analyser les résultats

```bash
./analyze_results.sh
```

Affiche un rapport complet avec durées, tailles et bitrates.

## 📂 Fichiers créés

```
~/Videos/DVD_Convert2/
├── video_01.mp4        # Titre 1
├── video_02.mp4        # Titre 2
├── ...
└── conversion.log      # Historique détaillé
```

## ⚙️ Personnalisation

Éditez `convert_dvd.sh` pour modifier :

```bash
DVD_PATH="/votre/chemin/VIDEO_TS"      # Source DVD
OUTPUT_DIR="/votre/destination"         # Destination
VIDEO_PRESET="medium"                   # slow/medium/fast
VIDEO_CRF="18"                          # Qualité (18-23)
```

## 🆘 Résolution de problèmes

| Problème | Solution |
|----------|----------|
| DVD non trouvé | Vérifiez `DVD_PATH` dans le script |
| Vidéo trop courte | Normal pour pistes < 10s (rejetées) |
| Perte de durée > 5% | DVD endommagé, nettoyez et réessayez |
| Erreurs FFmpeg | Consultez `conversion.log` |

## 💡 Astuces

**Suivre la conversion en direct :**
```bash
tail -f ~/Videos/DVD_Convert2/conversion.log
```

**Convertir seulement certains titres :**
Commentez les lignes non désirées dans le script

**Optimiser la vitesse :**
Changez `VIDEO_PRESET="fast"` (qualité légèrement moindre)

**Qualité maximale :**
Changez `VIDEO_PRESET="slow"` et `VIDEO_CRF="18"`

## 📊 Principales améliorations v2.0

✅ Gestion robuste des erreurs de lecture DVD  
✅ Récupération automatique des frames corrompus  
✅ Détection des pertes de données  
✅ Logs horodatés professionnels  
✅ Validation automatique de l'intégrité  
✅ Statistiques détaillées  
✅ Nettoyage automatique des fichiers temporaires  

---

**Besoin d'aide ?** Consultez le `README.md` complet.
