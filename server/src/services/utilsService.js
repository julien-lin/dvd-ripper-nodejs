/**
 * Service d'utilitaires divers
 */

/**
 * Ajouter un log avec timestamp
 * @param {string} level - Niveau du log (info, error, success)
 * @param {string} message - Message du log
 * @returns {object} - Entrée de log formatée
 */
export function createLogEntry(level, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  console.log(`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`);
  return logEntry;
}

/**
 * Vérifier la disponibilité de bc
 * @returns {Promise<boolean>}
 */
export async function checkBcAvailability() {
  const { exec } = await import('child_process');
  return new Promise((resolve) => {
    exec('which bc', (error) => {
      resolve(!error);
    });
  });
}

export default {
  createLogEntry,
  checkBcAvailability,
};

