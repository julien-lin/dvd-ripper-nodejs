/**
 * Utilitaires de formatage partagés
 * Utilisés par le frontend et potentiellement le backend
 */

/**
 * Formate une durée en secondes au format HH:MM:SS
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée (ex: "01:23:45")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formate une taille en bytes en format lisible (KB, MB, GB, etc.)
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée (ex: "1.5 GB")
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calcule le bitrate en Mbps à partir d'une taille et d'une durée
 * @param {number} sizeInBytes - Taille du fichier en bytes
 * @param {number} durationInSeconds - Durée en secondes
 * @returns {string} Bitrate formaté (ex: "4.56")
 */
export function calculateBitrate(sizeInBytes, durationInSeconds) {
  if (!sizeInBytes || !durationInSeconds) return 'N/A';
  
  const bitrate = (sizeInBytes * 8 / durationInSeconds / 1000000).toFixed(2);
  return bitrate;
}

/**
 * Formate une date au format français lisible
 * @param {Date|string} date - Date à formater
 * @returns {string} Date formatée (ex: "30 déc. 2025, 14:32")
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

