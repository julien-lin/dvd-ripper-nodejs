import { homedir } from 'os';
import { resolve } from 'path';

// SÉCURITÉ: Racines autorisées pour la navigation (protection Path Traversal)
const ALLOWED_ROOTS = [
  '/media',
  '/mnt',
  '/Volumes', // macOS
  homedir(), // Dossier utilisateur
];

/**
 * Vérifie si un chemin est autorisé (protection Path Traversal)
 * @param {string} userPath - Chemin fourni par l'utilisateur
 * @returns {boolean} - true si le chemin est autorisé
 */
export function isPathAllowed(userPath) {
  const resolvedPath = resolve(userPath);
  return ALLOWED_ROOTS.some((root) => resolvedPath.startsWith(resolve(root)));
}

/**
 * Valide un nom de fichier (protection Command Injection)
 * @param {string} filename - Nom de fichier à valider
 * @returns {boolean} - true si le nom est valide
 */
export function isValidFilename(filename) {
  // Accepter uniquement les noms de fichiers alphanumériques + certains caractères
  // Bloquer les caractères dangereux: ; & | $ ` < > \n \r
  const dangerousChars = /[;&|$`<>\n\r]/;
  return !dangerousChars.test(filename);
}

export default {
  isPathAllowed,
  isValidFilename,
  ALLOWED_ROOTS,
};

