import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { 
  scanDvdSchema, 
  listDirectorySchema, 
  convertSchema, 
  analyzeSchema,
  validate,
  validateQuery 
} from './validation.js';
import { 
  getVideoDuration, 
  formatDuration, 
  formatBytes, 
  checkFfmpegDependencies 
} from './src/services/ffmpegService.js';
// convertVTS est défini localement car il a une logique spécifique de concaténation
import { 
  isPathAllowed, 
  isValidFilename 
} from './src/services/securityService.js';
import { 
  createLogEntry, 
  checkBcAvailability 
} from './src/services/utilsService.js';
import { 
  initializeWebSocket,
  emitConversionProgress,
  emitConversionComplete,
  emitConversionError,
  emitConversionStopped 
} from './src/services/websocketService.js';
import {
  saveConversionState,
  loadConversionState,
  clearConversionState,
  prepareResumeState,
} from './src/services/stateService.js';
import {
  loadHistory,
  addToHistory,
  getHistoryStats,
  clearHistory,
} from './src/services/historyService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Créer le serveur HTTP
const httpServer = createServer(app);

// Initialiser Socket.io avec CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialiser le service WebSocket
initializeWebSocket(io);

app.use(cors());
// SÉCURITÉ: Limiter la taille des requêtes JSON (protection DoS)
app.use(express.json({ limit: '10mb' }));

// SÉCURITÉ: Rate limiters pour prévenir les abus
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 scans maximum par minute
  message: { error: 'Trop de requêtes de scan. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const convertLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 conversions maximum par minute
  message: { error: 'Trop de conversions lancées. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const listDirectoryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes maximum par minute
  message: { error: 'Trop de requêtes de navigation. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requêtes maximum par minute
  message: { error: 'Trop de requêtes. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiter général à toutes les routes
app.use('/api/', generalLimiter);

// Variables globales pour suivre la conversion
let currentConversion = null;
let conversionProcess = null;
let conversionLock = false; // Mutex pour éviter race conditions

// Les fonctions de sécurité (isPathAllowed, isValidFilename) sont importées depuis src/services/securityService.js

// Vérifier les dépendances
app.get('/api/check-dependencies', async (req, res) => {
  try {
    // Utiliser le service ffmpeg pour vérifier ffmpeg/ffprobe
    const ffmpegDeps = checkFfmpegDependencies();
    
    // Vérifier bc
    const bcExists = await checkBcAvailability();

    res.json({
      ffmpeg: ffmpegDeps.ffmpeg,
      ffprobe: ffmpegDeps.ffprobe,
      bc: bcExists,
      allInstalled: ffmpegDeps.ffmpeg && ffmpegDeps.ffprobe && bcExists,
      embedded: ffmpegDeps.embedded
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des dépendances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lister le contenu d'un répertoire
app.post('/api/list-directory', listDirectoryLimiter, validate(listDirectorySchema), async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Chemin requis' });
    }

    // SÉCURITÉ: Bloquer path traversal
    if (path.includes('..')) {
      console.warn('⚠️ Tentative de path traversal bloquée:', path);
      return res.status(403).json({ error: 'Chemin non autorisé: path traversal détecté' });
    }

    // Normaliser le chemin
    let normalizedPath = path;
    if (path === '~') {
      normalizedPath = process.env.HOME || process.env.USERPROFILE || '/'; // eslint-disable-line no-undef
    } else if (path.startsWith('~/')) {
      normalizedPath = join(process.env.HOME || process.env.USERPROFILE || '/', path.slice(2)); // eslint-disable-line no-undef
    }

    // SÉCURITÉ: Vérifier whitelist
    if (!isPathAllowed(normalizedPath)) {
      console.warn('⚠️ Accès refusé à:', normalizedPath);
      return res.status(403).json({ 
        error: 'Accès refusé: ce dossier n\'est pas autorisé',
        allowedRoots: ALLOWED_ROOTS 
      });
    }

    // Vérifier que le chemin existe
    if (!existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Répertoire introuvable' });
    }

    // Vérifier que c'est un répertoire
    const stats = statSync(normalizedPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Le chemin spécifié n\'est pas un répertoire' });
    }

    // Lire le contenu du répertoire
    const entries = readdirSync(normalizedPath, { withFileTypes: true });
    
    const items = entries
      .map(entry => {
        const fullPath = join(normalizedPath, entry.name);
        try {
          const entryStats = statSync(fullPath);
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entryStats.isDirectory(),
            isFile: entryStats.isFile()
          };
        } catch {
          // Ignorer les entrées inaccessibles
          return null;
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => {
        // Dossiers en premier, puis fichiers, puis tri alphabétique
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    res.json({ 
      path: normalizedPath,
      items 
    });
  } catch (error) {
    console.error('Erreur list-directory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scanner les VTS d'un DVD
app.post('/api/scan-dvd', scanLimiter, validate(scanDvdSchema), async (req, res) => {
  try {
    const { dvdPath } = req.body;
    
    if (!dvdPath || !existsSync(dvdPath)) {
      return res.status(400).json({ error: 'Chemin DVD invalide' });
    }

    const vobFiles = readdirSync(dvdPath)
      .filter(file => file.match(/^VTS_\d{2}_\d+\.VOB$/i))
      .filter(file => isValidFilename(file)) // SÉCURITÉ: Bloquer command injection
      .sort();

    // Grouper par VTS
    const vtsGroups = {};
    vobFiles.forEach(file => {
      const match = file.match(/^VTS_(\d{2})_\d+\.VOB$/i);
      if (match) {
        const vtsNum = match[1];
        if (!vtsGroups[vtsNum]) {
          vtsGroups[vtsNum] = [];
        }
        vtsGroups[vtsNum].push(file);
      }
    });

    // Obtenir les durées pour chaque VTS
    const vtsList = await Promise.all(
      Object.entries(vtsGroups).map(async ([vtsNum, files]) => {
        const filePaths = files.map(f => join(dvdPath, f));
        
        try {
          // Essayer de lire le premier fichier pour obtenir la durée
          // Pour une durée totale précise, il faudrait additionner tous les fichiers
          let totalDuration = 0;
          for (const filePath of filePaths) {
            try {
              const duration = await getVideoDuration(filePath);
              totalDuration += duration || 0;
            } catch (err) {
              console.warn(`Erreur lecture ${filePath}:`, err.message);
            }
          }
          
          return {
            vts: vtsNum,
            files: files.length,
            duration: totalDuration,
            durationFormatted: formatDuration(totalDuration)
          };
        } catch (error) {
          return {
            vts: vtsNum,
            files: files.length,
            duration: 0,
            durationFormatted: 'N/A',
            error: error.message
          };
        }
      })
    );

    res.json({ vtsList: vtsList.sort((a, b) => a.vts.localeCompare(b.vts)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Générer un thumbnail pour un VTS
app.get('/api/vts-thumbnail/:vts', async (req, res) => {
  try {
    const { vts } = req.params;
    const { dvdPath } = req.query;

    if (!dvdPath) {
      return res.status(400).json({ error: 'dvdPath requis' });
    }

    // SÉCURITÉ: Vérifier que le chemin est autorisé
    if (!isPathAllowed(dvdPath)) {
      return res.status(403).json({ error: 'Chemin non autorisé' });
    }

    if (!existsSync(dvdPath)) {
      return res.status(404).json({ error: 'Chemin DVD introuvable' });
    }

    // Valider le numéro VTS
    const vtsNum = parseInt(vts);
    if (isNaN(vtsNum) || vtsNum < 1 || vtsNum > 99) {
      return res.status(400).json({ error: 'Numéro VTS invalide' });
    }

    // Trouver les fichiers VOB pour ce VTS
    const allFiles = readdirSync(dvdPath);
    const vobFiles = allFiles.filter(f => 
      f.toUpperCase().startsWith(`VTS_${String(vtsNum).padStart(2, '0')}_`) &&
      f.toUpperCase().endsWith('.VOB') &&
      !f.toUpperCase().endsWith('_0.VOB') // Exclure le menu
    ).sort();

    if (vobFiles.length === 0) {
      return res.status(404).json({ error: `Aucun fichier VOB trouvé pour VTS_${vts}` });
    }

    // Prendre le premier fichier VOB
    const firstVobPath = join(dvdPath, vobFiles[0]);

    // Créer un dossier temporaire pour les thumbnails
    const thumbnailDir = join(tmpdir(), 'dvd-thumbnails');
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const thumbnailFilename = `vts_${vtsNum}_${Date.now()}.jpg`;
    const thumbnailPath = join(thumbnailDir, thumbnailFilename);

    // Extraire un frame à 10% de la vidéo avec FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(firstVobPath)
        .screenshots({
          timestamps: ['10%'], // Frame à 10% de la durée
          filename: thumbnailFilename,
          folder: thumbnailDir,
          size: '320x240' // Taille optimale pour thumbnail
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Vérifier que le fichier a été créé
    if (!existsSync(thumbnailPath)) {
      return res.status(500).json({ error: 'Échec de génération du thumbnail' });
    }

    // Envoyer l'image
    res.sendFile(thumbnailPath, (err) => {
      // Supprimer le fichier après l'envoi
      try {
        if (existsSync(thumbnailPath)) {
          unlinkSync(thumbnailPath);
        }
      } catch (cleanupError) {
        console.warn('Erreur lors du nettoyage du thumbnail:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Erreur génération thumbnail:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fonctions getVideoDuration et formatDuration importées depuis src/services/ffmpegService.js

// Démarrer la conversion
app.post('/api/convert', convertLimiter, validate(convertSchema), async (req, res) => {
  try {
    // SÉCURITÉ: Mutex pour éviter race condition (2 conversions simultanées)
    if (conversionLock || currentConversion) {
      return res.status(400).json({ error: 'Une conversion est déjà en cours' });
    }
    
    // Acquérir le lock
    conversionLock = true;

    const {
      dvdPath,
      outputDir,
      videoPreset = 'medium',
      videoCrf = '18',
      audioBitrate = '192k',
      selectedVts = []
    } = req.body;

    if (!dvdPath || !existsSync(dvdPath)) {
      return res.status(400).json({ error: 'Chemin DVD invalide' });
    }

    if (!outputDir) {
      return res.status(400).json({ error: 'Répertoire de sortie requis' });
    }

    // Créer le répertoire de sortie
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Scanner les VTS pour initialiser le progress avec tous les titres
    const vobFiles = readdirSync(dvdPath)
      .filter(file => file.match(/^VTS_\d{2}_\d+\.VOB$/i))
      .filter(file => isValidFilename(file)) // SÉCURITÉ: Bloquer command injection
      .sort();

    const vtsGroups = {};
    vobFiles.forEach(file => {
      const match = file.match(/^VTS_(\d{2})_\d+\.VOB$/i);
      if (match) {
        const vtsNum = match[1];
        if (!vtsGroups[vtsNum]) {
          vtsGroups[vtsNum] = [];
        }
        vtsGroups[vtsNum].push(file);
      }
    });

    const vtsToConvert = selectedVts.length > 0 
      ? Object.keys(vtsGroups).filter(vts => selectedVts.includes(vts))
      : Object.keys(vtsGroups);

    // Initialiser le progress avec tous les VTS en attente
    const initialProgress = vtsToConvert.sort().map(vtsNum => ({
      vts: vtsNum,
      status: 'pending',
      progress: 0,
      message: `VTS_${vtsNum} en attente`,
      startTime: null
    }));

    currentConversion = {
      dvdPath,
      outputDir,
      videoPreset,
      videoCrf,
      audioBitrate,
      selectedVts,
      startTime: new Date(),
      status: 'running',
      progress: initialProgress,
      logs: []
    };

    // Démarrer la conversion en arrière-plan
    startConversion(currentConversion);
    
    // Libérer le lock après initialisation
    conversionLock = false;

    res.json({ message: 'Conversion démarrée', conversion: currentConversion });
  } catch (error) {
    // Libérer le lock en cas d'erreur
    conversionLock = false;
    res.status(500).json({ error: error.message });
  }
});

// Fonction principale de conversion
async function startConversion(config) {
  const { dvdPath, outputDir, videoPreset, videoCrf, audioBitrate, selectedVts } = config;
  
  // Scanner les VTS
  const vobFiles = readdirSync(dvdPath)
    .filter(file => file.match(/^VTS_\d{2}_\d+\.VOB$/i))
    .filter(file => isValidFilename(file)) // SÉCURITÉ: Bloquer command injection
    .sort();

  const vtsGroups = {};
  vobFiles.forEach(file => {
    const match = file.match(/^VTS_(\d{2})_\d+\.VOB$/i);
    if (match) {
      const vtsNum = match[1];
      if (!vtsGroups[vtsNum]) {
        vtsGroups[vtsNum] = [];
      }
      vtsGroups[vtsNum].push(file);
    }
  });

  const vtsToConvert = selectedVts.length > 0 
    ? Object.keys(vtsGroups).filter(vts => selectedVts.includes(vts))
    : Object.keys(vtsGroups);

  let success = 0;
  let failed = 0;

  for (const vtsNum of vtsToConvert.sort()) {
    // Vérifier si la conversion a été arrêtée
    if (currentConversion?.status === 'stopped') {
      addLog('INFO', 'Conversion arrêtée, interruption de la boucle');
      break;
    }
    
    const files = vtsGroups[vtsNum];
    const filePaths = files.map(f => join(dvdPath, f));
    const concatInput = filePaths.join('|');
    const outputFile = join(outputDir, `video_${vtsNum}.mp4`);

    // Trouver et mettre à jour le progressItem existant
    const progressItem = currentConversion.progress.find(p => p.vts === vtsNum);
    if (progressItem) {
      progressItem.status = 'processing';
      progressItem.progress = 0;
      progressItem.message = `Conversion VTS_${vtsNum}`;
      progressItem.startTime = new Date();
    }

    addLog(`INFO`, `Début conversion VTS_${vtsNum}`);

    try {
      // Calculer la durée attendue (somme de tous les fichiers)
      let expectedDuration = 0;
      for (const filePath of filePaths) {
        try {
          const duration = await getVideoDuration(filePath);
          expectedDuration += duration || 0;
        } catch (err) {
          console.warn(`Erreur lecture ${filePath}:`, err.message);
        }
      }
      addLog(`INFO`, `VTS_${vtsNum}: Durée attendue ${formatDuration(expectedDuration)}`);

      // Conversion avec ffmpeg
      await convertVTS(concatInput, outputFile, {
        preset: videoPreset,
        crf: videoCrf,
        audioBitrate: audioBitrate
      }, (progress) => {
        progressItem.progress = progress;
        progressItem.message = `Conversion VTS_${vtsNum}: ${progress}%`;
        // Émettre la progression en temps réel via WebSocket
        emitConversionProgress(currentConversion);
        // Sauvegarder l'état périodiquement (tous les 10%)
        if (progress % 10 === 0) {
          saveConversionState(currentConversion);
        }
      }, expectedDuration);

      // Vérifier le résultat
      if (existsSync(outputFile)) {
        addLog('INFO', `Vérification du fichier de sortie...`);
        const actualDuration = await getVideoDuration(outputFile);
        const fileSize = statSync(outputFile).size;
        const bitrate = (fileSize * 8 / actualDuration / 1000000).toFixed(2);
        
        progressItem.status = 'success';
        progressItem.progress = 100;
        progressItem.message = `VTS_${vtsNum} converti avec succès`;
        progressItem.duration = actualDuration;
        progressItem.size = fileSize;
        
        addLog(`OK`, `VTS_${vtsNum}: ${formatDuration(actualDuration)}, ${formatBytes(fileSize)}, ${bitrate} Mbps`);
        success++;
        // Sauvegarder l'état après chaque succès
        saveConversionState(currentConversion);
      } else {
        throw new Error('Fichier de sortie non créé');
      }
    } catch (error) {
      progressItem.status = 'error';
      progressItem.message = `Erreur VTS_${vtsNum}: ${error.message}`;
      addLog(`ERROR`, `VTS_${vtsNum}: ${error.message}`);
      failed++;
      // Sauvegarder l'état après chaque erreur
      saveConversionState(currentConversion);
    }
  }

  currentConversion.status = 'completed';
  currentConversion.endTime = new Date();
  currentConversion.elapsedTime = Math.floor((currentConversion.endTime - currentConversion.startTime) / 1000);
  
  // Déterminer le statut final
  if (failed === 0) {
    currentConversion.finalStatus = 'success';
  } else if (success > 0) {
    currentConversion.finalStatus = 'partial';
  } else {
    currentConversion.finalStatus = 'error';
  }
  
  addLog(`INFO`, `Conversion terminée: ${success} succès, ${failed} échecs`);
  
  // Émettre l'événement de complétion via WebSocket
  emitConversionComplete(currentConversion);
  
  // Ajouter à l'historique
  addToHistory({
    ...currentConversion,
    status: currentConversion.finalStatus,
  });
  
  // Supprimer l'état sauvegardé car la conversion est terminée
  clearConversionState();
}

// Convertir un VTS
function convertVTS(input, output, options, onProgress, expectedDuration = 0) {
  return new Promise((resolve, reject) => {
    // input est au format "file1|file2|file3"
    const files = input.split('|');
    
    // Créer un fichier de concaténation temporaire
    const concatFile = join(tmpdir(), `concat_${Date.now()}.txt`);
    const concatContent = files.map(file => `file '${file}'`).join('\n');
    
    try {
      writeFileSync(concatFile, concatContent);
    } catch (err) {
      return reject(new Error(`Erreur création fichier concat: ${err.message}`));
    }
    
    let lastProgressUpdate = 0;
    
    // Fonction pour parser le timemark (format: HH:MM:SS.ms)
    const parseTimemark = (timemark) => {
      if (!timemark) return 0;
      const parts = timemark.split(':');
      if (parts.length !== 3) return 0;
      const hours = parseFloat(parts[0]) || 0;
      const minutes = parseFloat(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    const command = ffmpeg()
      .input(concatFile)
      .inputOptions([
        '-f', 'concat',
        '-safe', '0',
        '-err_detect', 'ignore_err',
        '-fflags', '+genpts+igndts'
      ])
      .videoFilters([
        'yadif=mode=send_frame:parity=auto',
        'setpts=PTS-STARTPTS'
      ])
      .videoCodec('libx264')
      .addOption('-preset', options.preset)
      .addOption('-crf', options.crf)
      .audioCodec('aac')
      .audioBitrate(options.audioBitrate)
      .audioFilters('aresample=async=1:first_pts=0')
      .outputOptions([
        '-movflags', '+faststart',
        '-async', '1',
        '-fps_mode', 'cfr',
        '-max_muxing_queue_size', '9999'
      ])
      .output(output)
      .on('start', () => {
        addLog('INFO', `Démarrage de l'encodage...`);
        addLog('INFO', `Configuration: ${options.preset} preset, CRF ${options.crf}`);
      })
      .on('progress', (progressInfo) => {
        const now = Date.now();
        
        // Throttling : mise à jour max toutes les 500ms
        if (now - lastProgressUpdate < 500) {
          return;
        }
        lastProgressUpdate = now;
        
        // Calcul du pourcentage basé sur le timemark et la durée attendue
        let percent = 0;
        
        // Priorité 1 : Utiliser progress.percent si disponible et valide
        if (progressInfo.percent !== undefined && progressInfo.percent !== null) {
          const rawPercent = parseFloat(progressInfo.percent);
          if (!isNaN(rawPercent) && rawPercent > 0 && rawPercent <= 100) {
            percent = Math.round(rawPercent);
          }
        }
        
        // Priorité 2 : Calculer depuis timemark si percent = 0 et qu'on a une durée attendue
        if (percent === 0 && progressInfo.timemark && expectedDuration > 0) {
          const currentTime = parseTimemark(progressInfo.timemark);
          if (currentTime > 0) {
            percent = Math.min(99, Math.round((currentTime / expectedDuration) * 100));
          }
        }
        
        // Log de progression avec informations détaillées
        if (progressInfo.timemark) {
          addLog('INFO', `Progression: ${percent}% (${progressInfo.timemark})`);
        }
        
        // Mettre à jour la progression
        onProgress(percent);
      })
      .on('end', () => {
        addLog('INFO', `Encodage terminé avec succès`);
        // Nettoyer le fichier temporaire
        try {
          if (existsSync(concatFile)) {
            unlinkSync(concatFile);
          }
        } catch (err) {
          console.warn(`Erreur suppression ${concatFile}:`, err.message);
        }
        resolve();
      })
      .on('error', (err) => {
        // Nettoyer le fichier temporaire même en cas d'erreur
        try {
          if (existsSync(concatFile)) {
            unlinkSync(concatFile);
          }
        } catch (cleanupErr) {
          console.warn(`Erreur suppression ${concatFile}:`, cleanupErr.message);
        }
        reject(err);
      });

    command.run();
    conversionProcess = command;
  });
}

// Ajouter un log
function addLog(level, message) {
  const logEntry = createLogEntry(level, message);
  if (currentConversion) {
    currentConversion.logs.push(logEntry);
    // Garder seulement les 100 derniers logs
    if (currentConversion.logs.length > 100) {
      currentConversion.logs.shift();
    }
  }
}

// Récupérer l'état sauvegardé pour reprise
app.get('/api/resume/state', (req, res) => {
  try {
    const savedState = loadConversionState();
    if (!savedState) {
      return res.json({ hasState: false });
    }
    
    // Préparer l'état pour la reprise
    const resumeState = prepareResumeState(savedState, savedState.outputDir);
    
    // Compter les VTS à reprendre vs déjà complétés
    const totalVTS = resumeState.progress.length;
    const completedVTS = resumeState.progress.filter(p => p.status === 'success').length;
    const remainingVTS = totalVTS - completedVTS;
    
    res.json({
      hasState: true,
      state: resumeState,
      stats: {
        total: totalVTS,
        completed: completedVTS,
        remaining: remainingVTS,
      },
    });
  } catch (error) {
    console.error('Erreur récupération état:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer l'état sauvegardé (refuser la reprise)
app.delete('/api/resume/state', (req, res) => {
  try {
    clearConversionState();
    res.json({ success: true, message: 'État supprimé' });
  } catch (error) {
    console.error('Erreur suppression état:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias pour le frontend (format kebab-case)
app.get('/api/resume-state', (req, res) => {
  try {
    const savedState = loadConversionState();
    if (!savedState) {
      return res.json({ hasSavedState: false });
    }
    
    res.json({
      hasSavedState: true,
      state: savedState,
    });
  } catch (error) {
    console.error('Erreur récupération état:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clear-resume-state', (req, res) => {
  try {
    clearConversionState();
    res.json({ success: true, message: 'État de reprise effacé.' });
  } catch (error) {
    console.error('Erreur suppression état:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reprendre une conversion
app.post('/api/resume', async (req, res) => {
  try {
    // Vérifier qu'il n'y a pas déjà une conversion en cours
    if (conversionLock || currentConversion) {
      return res.status(400).json({ error: 'Une conversion est déjà en cours' });
    }
    
    // Charger l'état sauvegardé
    const savedState = loadConversionState();
    if (!savedState) {
      return res.status(404).json({ error: 'Aucun état de conversion à reprendre' });
    }
    
    // Préparer l'état pour la reprise
    const resumeState = prepareResumeState(savedState, savedState.outputDir);
    
    // Acquérir le lock
    conversionLock = true;
    
    // Initialiser la conversion avec l'état repris
    currentConversion = resumeState;
    currentConversion.startTime = new Date(); // Nouvelle heure de départ
    
    // Démarrer la conversion en arrière-plan
    startConversion(currentConversion);
    
    // Libérer le lock après initialisation
    conversionLock = false;
    
    // Supprimer l'état sauvegardé (il sera recréé pendant la conversion)
    clearConversionState();
    
    res.json({ 
      message: 'Conversion reprise avec succès', 
      conversion: currentConversion,
    });
  } catch (error) {
    conversionLock = false;
    console.error('Erreur reprise conversion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le statut de la conversion
app.get('/api/status', (req, res) => {
  if (!currentConversion) {
    return res.json({ status: 'idle' });
  }
  res.json(currentConversion);
});

// Arrêter la conversion
app.post('/api/stop', (req, res) => {
  if (conversionProcess) {
    try {
      // Essayer SIGTERM d'abord (arrêt propre)
      addLog('INFO', 'Arrêt de la conversion en cours...');
      conversionProcess.kill('SIGTERM');
      
      // Si le processus ne s'arrête pas après 2 secondes, forcer avec SIGKILL
      setTimeout(() => {
        if (conversionProcess) {
          try {
            conversionProcess.kill('SIGKILL');
            addLog('WARN', 'Arrêt forcé du processus ffmpeg');
          } catch (err) {
            console.error('Erreur lors de l\'arrêt forcé:', err);
          }
        }
      }, 2000);
      
      conversionProcess = null;
    } catch (err) {
      console.error('Erreur lors de l\'arrêt du processus:', err);
      addLog('ERROR', `Erreur lors de l'arrêt: ${err.message}`);
    }
  }
  
  if (currentConversion) {
    // Marquer toutes les conversions en cours comme arrêtées
    currentConversion.progress.forEach(item => {
      if (item.status === 'processing') {
        item.status = 'cancelled';
        item.message = `VTS_${item.vts} : Arrêté par l'utilisateur`;
      }
    });
    
    currentConversion.status = 'stopped';
    currentConversion.endTime = new Date();
    addLog('INFO', 'Conversion arrêtée par l\'utilisateur');
    
    // Sauvegarder l'état pour permettre la reprise
    saveConversionState(currentConversion);
    
    // Émettre l'événement d'arrêt via WebSocket
    emitConversionStopped(currentConversion);
  }
  
  res.json({ message: 'Conversion arrêtée' });
});

// Récupérer l'historique des conversions
app.get('/api/history', (req, res) => {
  try {
    const history = loadHistory();
    res.json({ history });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les statistiques globales
app.get('/api/history/stats', (req, res) => {
  try {
    const stats = getHistoryStats();
    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer l'historique
app.delete('/api/history', (req, res) => {
  try {
    const success = clearHistory();
    if (success) {
      res.json({ message: 'Historique supprimé avec succès' });
    } else {
      res.status(500).json({ error: 'Échec de la suppression de l\'historique' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyser les résultats
app.get('/api/analyze', validateQuery(analyzeSchema), async (req, res) => {
  try {
    const { outputDir } = req.query;
    
    if (!outputDir || !existsSync(outputDir)) {
      return res.status(400).json({ error: 'Répertoire invalide' });
    }

    const files = readdirSync(outputDir)
      .filter(file => file.match(/^video_\d+\.mp4$/i))
      .sort();

    const results = await Promise.all(
      files.map(async (file) => {
        const filePath = join(outputDir, file);
        try {
          const duration = await getVideoDuration(filePath);
          const stats = statSync(filePath);
          const bitrate = stats.size * 8 / duration / 1000000; // Mbps
          
          return {
            filename: file,
            duration: duration,
            durationFormatted: formatDuration(duration),
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            bitrate: bitrate.toFixed(2)
          };
        } catch (error) {
          return {
            filename: file,
            error: error.message
          };
        }
      })
    );

    const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);

    res.json({
      files: results,
      totalFiles: results.length,
      totalSize: totalSize,
      totalSizeFormatted: formatBytes(totalSize)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Formater les bytes
// Fonction formatBytes importée depuis src/services/ffmpegService.js

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`✓ WebSocket activé pour le temps réel`);
});


