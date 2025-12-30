import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configuration des binaires ffmpeg embarqués
let ffmpegPath = null;
let ffprobePath = null;

try {
  if (ffmpegStatic && typeof ffmpegStatic === 'string') {
    ffmpegPath = ffmpegStatic;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`✓ ffmpeg embarqué: ${ffmpegPath}`);
  } else {
    console.warn('⚠ ffmpeg-static retourne null ou valeur inattendue');
  }
} catch (error) {
  console.error('✗ Erreur lors de l\'import de ffmpeg-static:', error.message);
}

try {
  if (ffprobeStatic) {
    if (typeof ffprobeStatic === 'string') {
      ffprobePath = ffprobeStatic;
    } else if (ffprobeStatic.path) {
      ffprobePath = ffprobeStatic.path;
    } else if (ffprobeStatic.default) {
      const defaultExport = ffprobeStatic.default;
      ffprobePath = typeof defaultExport === 'string' 
        ? defaultExport 
        : defaultExport.path;
    }
    
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
      console.log(`✓ ffprobe embarqué: ${ffprobePath}`);
    } else {
      console.warn('⚠ ffprobe-static structure inattendue');
    }
  } else {
    console.warn('⚠ ffprobe-static retourne null');
  }
} catch (error) {
  console.error('✗ Erreur lors de l\'import de ffprobe-static:', error.message);
}

/**
 * Obtenir la durée d'une vidéo
 * @param {string} input - Chemin du fichier vidéo
 * @returns {Promise<number>} - Durée en secondes
 */
export function getVideoDuration(input) {
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

/**
 * Formater une durée en secondes au format HH:MM:SS
 * @param {number} seconds - Durée en secondes
 * @returns {string} - Durée formatée
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formater une taille en octets
 * @param {number} bytes - Taille en octets
 * @returns {string} - Taille formatée (ex: "1.5 GB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Convertir un VTS (ensemble de fichiers VOB) en MP4
 * @param {string} input - Chemin du fichier VOB ou liste de fichiers
 * @param {string} output - Chemin du fichier de sortie MP4
 * @param {object} options - Options de conversion (preset, crf, audioBitrate)
 * @param {function} onProgress - Callback de progression
 * @param {number} expectedDuration - Durée attendue en secondes
 * @returns {Promise<void>}
 */
export function convertVTS(input, output, options, onProgress, expectedDuration = 0) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(input)
      .videoCodec('libx264')
      .videoFilter('yadif')
      .preset(options.preset || 'medium')
      .addOption('-crf', options.crf || '18')
      .audioCodec('aac')
      .audioBitrate(options.audioBitrate || '192k')
      .format('mp4');

    const startTime = Date.now();
    let lastProgressUpdate = startTime;

    command
      .on('start', (commandLine) => {
        console.log('Commande ffmpeg:', commandLine);
      })
      .on('progress', (progress) => {
        const parseTimemark = (timemark) => {
          if (!timemark) return 0;
          const parts = timemark.split(':');
          if (parts.length === 3) {
            const h = parseInt(parts[0]) || 0;
            const m = parseInt(parts[1]) || 0;
            const s = parseFloat(parts[2]) || 0;
            return h * 3600 + m * 60 + s;
          }
          return 0;
        };

        const now = Date.now();
        if (now - lastProgressUpdate > 1000) {
          const currentTime = parseTimemark(progress.timemark);
          const rawPercent = expectedDuration > 0
            ? Math.min(Math.round((currentTime / expectedDuration) * 100), 100)
            : Math.min(Math.round(progress.percent || 0), 100);

          onProgress({
            percent: rawPercent,
            currentTime,
            targetTime: expectedDuration,
            fps: progress.currentFps || 0,
            bitrate: progress.currentKbps || 0,
          });

          lastProgressUpdate = now;
        }
      })
      .on('end', () => {
        onProgress({ percent: 100 });
        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Erreur ffmpeg:', err.message);
        console.error('Stderr:', stderr);
        reject(err);
      });

    command.save(output);
  });
}

/**
 * Vérifier la disponibilité des dépendances ffmpeg/ffprobe
 * @returns {object} - Statut des dépendances
 */
export function checkFfmpegDependencies() {
  return {
    ffmpeg: !!ffmpegPath,
    ffprobe: !!ffprobePath,
    ffmpegPath,
    ffprobePath,
    embedded: true,
  };
}

export default {
  getVideoDuration,
  formatDuration,
  formatBytes,
  convertVTS,
  checkFfmpegDependencies,
  ffmpeg,
};

