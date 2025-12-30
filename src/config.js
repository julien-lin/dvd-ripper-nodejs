/**
 * Configuration de l'application
 * Centralise toutes les variables d'environnement et configuration
 */

// URL de l'API backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mode de l'application
export const APP_MODE = import.meta.env.MODE || 'development';

// Activer les logs de debug
export const DEBUG = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development';

// Configuration du polling (en millisecondes)
export const POLLING_INTERVAL = 5000; // 5 secondes

// Configuration UI
export const UI_CONFIG = {
  // Nombre maximum de logs affichés
  maxLogs: 100,
  
  // Durée des notifications (ms)
  notificationDuration: 5000,
  
  // Animation fade-in (ms)
  fadeInDuration: 500,
};

// Configuration des conversions
export const CONVERSION_CONFIG = {
  // Presets disponibles
  presets: ['slow', 'medium', 'fast'],
  
  // CRF min/max
  crfMin: 15,
  crfMax: 28,
  crfDefault: 18,
  
  // Bitrates audio disponibles
  audioBitrates: ['128k', '192k', '256k', '320k'],
  audioBitrateDefault: '192k',
};

// Fonction utilitaire pour logger en mode debug
export function debugLog(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Export par défaut pour import simple
export default {
  API_BASE_URL,
  APP_MODE,
  DEBUG,
  POLLING_INTERVAL,
  UI_CONFIG,
  CONVERSION_CONFIG,
  debugLog,
};

