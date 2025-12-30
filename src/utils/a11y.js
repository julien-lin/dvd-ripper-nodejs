/**
 * Utilitaires pour l'accessibilité (A11y)
 * Aide à créer une application accessible selon WCAG 2.1 AA
 */

/**
 * Créer un ID unique pour aria-describedby / aria-labelledby
 */
export function generateA11yId(prefix = 'a11y') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Annoncer un message aux lecteurs d'écran via une région live
 * @param {string} message - Message à annoncer
 * @param {string} priority - 'polite' (défaut) ou 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Créer ou récupérer la région live
  let liveRegion = document.getElementById('a11y-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  
  // Mettre à jour le message
  liveRegion.textContent = message;
  
  // Effacer après 1 seconde pour permettre de nouveaux messages
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

/**
 * Vérifier si un élément est visible dans le viewport
 */
export function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Faire défiler jusqu'à un élément et lui donner le focus
 */
export function scrollAndFocus(element) {
  if (!element) return;
  
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
  
  // Attendre la fin du scroll pour focus
  setTimeout(() => {
    element.focus();
  }, 300);
}

/**
 * Piège de focus pour les modales
 * @param {HTMLElement} container - Élément conteneur de la modale
 * @returns {Function} Fonction de nettoyage
 */
export function trapFocus(container) {
  if (!container) return () => {};
  
  // Trouver tous les éléments focusables
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Sauvegarder l'élément qui avait le focus avant
  const previouslyFocused = document.activeElement;
  
  // Donner le focus au premier élément
  firstElement?.focus();
  
  // Gérer Tab et Shift+Tab
  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Fonction de nettoyage
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    previouslyFocused?.focus();
  };
}

/**
 * Hook pour gérer Escape
 * @param {Function} callback - Fonction à appeler sur Escape
 */
export function handleEscape(callback) {
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      callback();
    }
  }
  
  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Formater une durée pour les lecteurs d'écran
 * @param {number} seconds - Durée en secondes
 * @returns {string} Description lisible
 */
export function formatDurationForScreenReader(seconds) {
  if (!seconds || seconds === 0) return '0 seconde';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
  
  return parts.join(' et ');
}

/**
 * Formater des bytes pour les lecteurs d'écran
 * @param {number} bytes - Taille en bytes
 * @returns {string} Description lisible
 */
export function formatBytesForScreenReader(bytes) {
  if (bytes === 0) return '0 octet';
  
  const k = 1024;
  const sizes = ['octets', 'kilo-octets', 'méga-octets', 'giga-octets', 'téra-octets'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  return `${value} ${sizes[i]}`;
}

export default {
  generateA11yId,
  announceToScreenReader,
  isElementInViewport,
  scrollAndFocus,
  trapFocus,
  handleEscape,
  formatDurationForScreenReader,
  formatBytesForScreenReader,
};

