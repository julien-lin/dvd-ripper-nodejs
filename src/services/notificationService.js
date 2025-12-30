/**
 * Service de notifications navigateur
 * Gère les notifications de bureau et les sons
 */

// Son de notification (notification simple)
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE');

/**
 * Vérifier si les notifications sont supportées
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Obtenir l'état de la permission
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Demander la permission pour les notifications
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Erreur demande permission notification:', error);
    return 'denied';
  }
}

/**
 * Afficher une notification de bureau
 */
export function showNotification(title, options = {}) {
  if (!isNotificationSupported()) {
    console.warn('Notifications non supportées');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permission notification non accordée');
    return null;
  }

  const defaultOptions = {
    icon: '/icon-192.png', // Vous pouvez ajouter votre icône
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Auto-fermer après 10 secondes si pas d'interaction requise
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  } catch (error) {
    console.error('Erreur affichage notification:', error);
    return null;
  }
}

/**
 * Jouer le son de notification
 */
export function playNotificationSound() {
  try {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(error => {
      console.warn('Impossible de jouer le son:', error);
    });
  } catch (error) {
    console.error('Erreur lecture son:', error);
  }
}

/**
 * Notification de conversion terminée
 */
export function notifyConversionComplete(stats) {
  const { success = 0, failed = 0 } = stats;
  
  showNotification('✅ Conversion terminée !', {
    body: `${success} fichier(s) converti(s) avec succès${failed > 0 ? `, ${failed} erreur(s)` : ''}`,
    tag: 'conversion-complete',
  });

  playNotificationSound();
}

/**
 * Notification d'erreur de conversion
 */
export function notifyConversionError(message) {
  showNotification('❌ Erreur de conversion', {
    body: message || 'Une erreur est survenue pendant la conversion',
    tag: 'conversion-error',
  });

  playNotificationSound();
}

/**
 * Notification de conversion arrêtée
 */
export function notifyConversionStopped() {
  showNotification('⏸️ Conversion arrêtée', {
    body: 'La conversion a été arrêtée par l\'utilisateur',
    tag: 'conversion-stopped',
  });

  playNotificationSound();
}

/**
 * Badge sur le titre de la page
 */
class TitleBadge {
  constructor() {
    this.originalTitle = document.title;
    this.isAnimating = false;
    this.intervalId = null;
  }

  /**
   * Définir le badge sur le titre
   */
  set(badge, message) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.isAnimating = true;
    let showBadge = true;

    this.intervalId = setInterval(() => {
      if (showBadge) {
        document.title = `${badge} ${message || this.originalTitle}`;
      } else {
        document.title = this.originalTitle;
      }
      showBadge = !showBadge;
    }, 1000);
  }

  /**
   * Définir un badge permanent
   */
  setPermanent(badge, message) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    document.title = `${badge} ${message || this.originalTitle}`;
  }

  /**
   * Réinitialiser le titre
   */
  reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isAnimating = false;
    document.title = this.originalTitle;
  }

  /**
   * Mettre à jour le titre original
   */
  updateOriginal(title) {
    this.originalTitle = title;
    if (!this.isAnimating) {
      document.title = title;
    }
  }
}

// Instance singleton du badge
export const titleBadge = new TitleBadge();

/**
 * Sauvegarder les préférences de notification
 */
export function saveNotificationPreferences(enabled) {
  try {
    localStorage.setItem('notifications-enabled', JSON.stringify(enabled));
  } catch (error) {
    console.error('Erreur sauvegarde préférences:', error);
  }
}

/**
 * Charger les préférences de notification
 */
export function loadNotificationPreferences() {
  try {
    const saved = localStorage.getItem('notifications-enabled');
    return saved !== null ? JSON.parse(saved) : true; // Activé par défaut
  } catch (error) {
    console.error('Erreur chargement préférences:', error);
    return true;
  }
}

export default {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  playNotificationSound,
  notifyConversionComplete,
  notifyConversionError,
  notifyConversionStopped,
  titleBadge,
  saveNotificationPreferences,
  loadNotificationPreferences,
};

