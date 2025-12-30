/**
 * Service WebSocket pour la communication temps réel
 * Événements émis:
 * - conversion:progress : Progression de la conversion
 * - conversion:complete : Conversion terminée
 * - conversion:error : Erreur pendant la conversion
 * - conversion:stopped : Conversion arrêtée par l'utilisateur
 */

let io = null;

/**
 * Initialiser le service WebSocket
 * @param {object} socketIO - Instance Socket.io
 */
export function initializeWebSocket(socketIO) {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log(`✓ Client WebSocket connecté: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`✗ Client WebSocket déconnecté: ${socket.id}`);
    });
  });
}

/**
 * Émettre un événement de progression de conversion
 * @param {object} data - Données de progression
 */
export function emitConversionProgress(data) {
  if (io) {
    io.emit('conversion:progress', data);
  }
}

/**
 * Émettre un événement de conversion terminée
 * @param {object} data - Données de résultat
 */
export function emitConversionComplete(data) {
  if (io) {
    io.emit('conversion:complete', data);
  }
}

/**
 * Émettre un événement d'erreur de conversion
 * @param {object} data - Données d'erreur
 */
export function emitConversionError(data) {
  if (io) {
    io.emit('conversion:error', data);
  }
}

/**
 * Émettre un événement d'arrêt de conversion
 * @param {object} data - Données d'arrêt
 */
export function emitConversionStopped(data) {
  if (io) {
    io.emit('conversion:stopped', data);
  }
}

/**
 * Émettre le statut actuel à un client spécifique
 * @param {string} socketId - ID du socket
 * @param {object} status - Statut de conversion
 */
export function emitStatusToClient(socketId, status) {
  if (io) {
    io.to(socketId).emit('status:update', status);
  }
}

export default {
  initializeWebSocket,
  emitConversionProgress,
  emitConversionComplete,
  emitConversionError,
  emitConversionStopped,
  emitStatusToClient,
};

