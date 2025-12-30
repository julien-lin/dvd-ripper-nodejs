import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { 
  scanDvdSchema, 
  listDirectorySchema, 
  convertSchema, 
  analyzeSchema,
  validate,
  validateQuery 
} from './validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Configuration ffmpeg avec binaires embarqués
// Utilisation des binaires statiques fournis par les packages npm
let ffmpegPath = null;
let ffprobePath = null;

try {
  // ffmpeg-static retourne directement le chemin (string)
  if (ffmpegStatic && typeof ffmpegStatic === 'string') {
    ffmpegPath = ffmpegStatic;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`✓ ffmpeg embarqué: ${ffmpegPath}`);
  } else {
    console.warn('⚠ ffmpeg-static retourne null ou valeur inattendue');
    console.warn('   Type:', typeof ffmpegStatic, 'Valeur:', ffmpegStatic);
  }
} catch (error) {
  console.error('✗ Erreur lors de l\'import de ffmpeg-static:', error.message);
}

try {
  // ffprobe-static retourne un objet avec une propriété path
  if (ffprobeStatic) {
    if (typeof ffprobeStatic === 'string') {
      ffprobePath = ffprobeStatic;
    } else if (ffprobeStatic.path) {
      ffprobePath = ffprobeStatic.path;
    } else if (ffprobeStatic.default) {
      // Gestion des exports par défaut ES modules
      const defaultExport = ffprobeStatic.default;
      ffprobePath = typeof defaultExport === 'string' 
        ? defaultExport 
        : defaultExport.path;
    }
    
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
      console.log(`✓ ffprobe embarqué: ${ffprobePath}`);
    } else {
      console.warn('⚠ ffprobe-static structure inattendue:', JSON.stringify(ffprobeStatic, null, 2));
    }
  } else {
    console.warn('⚠ ffprobe-static retourne null');
  }
} catch (error) {
  console.error('✗ Erreur lors de l\'import de ffprobe-static:', error.message);
}

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

// Whitelist des dossiers autorisés pour la navigation
const ALLOWED_ROOTS = [
  '/media',
  '/mnt',
  '/home',
  process.env.HOME || '', // eslint-disable-line no-undef
  process.env.USERPROFILE || '' // eslint-disable-line no-undef
].filter(Boolean);

// Fonction de sécurité : vérifier si un chemin est autorisé
function isPathAllowed(userPath) {
  try {
    const normalized = join(userPath); // Normalise et résout le chemin
    
    // Vérifier si le chemin commence par un des dossiers autorisés
    return ALLOWED_ROOTS.some(root => {
      const resolvedRoot = join(root);
      return normalized === resolvedRoot || normalized.startsWith(resolvedRoot + '/');
    });
  } catch {
    return false;
  }
}

// Fonction de sécurité : valider les noms de fichiers (protection command injection)
function isValidFilename(filename) {
  // Autoriser seulement: lettres, chiffres, tirets, underscores, points
  // Bloque: ; | & $ ( ) ` < > et autres caractères dangereux
  const safePattern = /^[a-zA-Z0-9_\-.]+$/;
  return safePattern.test(filename);
}

// Vérifier les dépendances
app.get('/api/check-dependencies', async (req, res) => {
  try {
    // Détecter les chemins des binaires embarqués
    let detectedFfmpegPath = null;
    let detectedFfprobePath = null;
    
    // Détecter ffmpeg (retourne directement le chemin string)
    if (ffmpegStatic && typeof ffmpegStatic === 'string') {
      detectedFfmpegPath = ffmpegStatic;
    }
    
    // Détecter ffprobe (retourne un objet avec propriété path)
    if (ffprobeStatic) {
      if (typeof ffprobeStatic === 'string') {
        detectedFfprobePath = ffprobeStatic;
      } else if (ffprobeStatic.path) {
        detectedFfprobePath = ffprobeStatic.path;
      } else if (ffprobeStatic.default) {
        const defaultExport = ffprobeStatic.default;
        detectedFfprobePath = typeof defaultExport === 'string' 
          ? defaultExport 
          : (defaultExport.path || null);
      }
    }
    
    // Vérifier que les fichiers existent
    const ffmpegExists = detectedFfmpegPath ? existsSync(detectedFfmpegPath) : false;
    const ffprobeExists = detectedFfprobePath ? existsSync(detectedFfprobePath) : false;
    
    // Logs de débogage si nécessaire
    if (!ffmpegExists) {
      console.warn('⚠ ffmpeg embarqué non trouvé. Chemin:', detectedFfmpegPath);
    }
    if (!ffprobeExists) {
      console.warn('⚠ ffprobe embarqué non trouvé. Chemin:', detectedFfprobePath);
    }
    
    // Vérifier bc (seule dépendance système nécessaire)
    const checkCommand = (cmd) => {
      return new Promise((resolve) => {
        const process = spawn('which', [cmd]);
        process.on('close', (code) => resolve(code === 0));
      });
    };
    const bcExists = await checkCommand('bc');

    res.json({
      ffmpeg: ffmpegExists,
      ffprobe: ffprobeExists,
      bc: bcExists,
      allInstalled: ffmpegExists && ffprobeExists && bcExists,
      embedded: true // Indique que ffmpeg/ffprobe sont embarqués
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

// Obtenir la durée d'une vidéo
function getVideoDuration(input) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

// Formater la durée
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
      } else {
        throw new Error('Fichier de sortie non créé');
      }
    } catch (error) {
      progressItem.status = 'error';
      progressItem.message = `Erreur VTS_${vtsNum}: ${error.message}`;
      addLog(`ERROR`, `VTS_${vtsNum}: ${error.message}`);
      failed++;
    }
  }

  currentConversion.status = 'completed';
  currentConversion.endTime = new Date();
  addLog(`INFO`, `Conversion terminée: ${success} succès, ${failed} échecs`);
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
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message
  };
  if (currentConversion) {
    currentConversion.logs.push(logEntry);
    // Garder seulement les 100 derniers logs
    if (currentConversion.logs.length > 100) {
      currentConversion.logs.shift();
    }
  }
}

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
  }
  
  res.json({ message: 'Conversion arrêtée' });
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
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});


