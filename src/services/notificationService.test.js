import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  playNotificationSound,
  saveNotificationPreferences,
  loadNotificationPreferences,
  titleBadge,
} from './notificationService';

describe('notificationService', () => {
  let originalNotification;
  let originalLocalStorage;

  beforeEach(() => {
    // Sauvegarder les API natives
    originalNotification = global.Notification;
    originalLocalStorage = global.localStorage;

    // Réinitialiser le badge
    titleBadge.reset();
  });

  afterEach(() => {
    // Restaurer les API natives
    if (originalNotification) {
      global.Notification = originalNotification;
    } else {
      delete global.Notification;
    }
    global.localStorage = originalLocalStorage;

    // Réinitialiser le titre
    titleBadge.reset();
    vi.clearAllTimers();
  });

  describe('isNotificationSupported', () => {
    it('retourne true si Notification est supportée', () => {
      global.Notification = vi.fn();
      expect(isNotificationSupported()).toBe(true);
    });

    it('retourne false si Notification n\'est pas supportée', () => {
      delete global.Notification;
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe('getNotificationPermission', () => {
    it('retourne "unsupported" si Notification n\'est pas supportée', () => {
      delete global.Notification;
      expect(getNotificationPermission()).toBe('unsupported');
    });

    it('retourne le statut de permission', () => {
      global.Notification = { permission: 'granted' };
      expect(getNotificationPermission()).toBe('granted');
    });
  });

  describe('requestNotificationPermission', () => {
    it('retourne "unsupported" si Notification n\'est pas supportée', async () => {
      delete global.Notification;
      const result = await requestNotificationPermission();
      expect(result).toBe('unsupported');
    });

    it('retourne "granted" si déjà accordé', async () => {
      global.Notification = { permission: 'granted' };
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
    });

    it('retourne "denied" si refusé', async () => {
      global.Notification = { permission: 'denied' };
      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('demande la permission si default', async () => {
      const requestPermission = vi.fn().mockResolvedValue('granted');
      global.Notification = { 
        permission: 'default',
        requestPermission,
      };
      
      const result = await requestNotificationPermission();
      expect(requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('gère les erreurs de requête', async () => {
      const requestPermission = vi.fn().mockRejectedValue(new Error('test'));
      global.Notification = { 
        permission: 'default',
        requestPermission,
      };
      
      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });
  });

  describe('showNotification', () => {
    it('retourne null si Notification n\'est pas supportée', () => {
      delete global.Notification;
      const result = showNotification('Test');
      expect(result).toBeNull();
    });

    it('retourne null si permission non accordée', () => {
      global.Notification = vi.fn();
      global.Notification.permission = 'denied';
      const result = showNotification('Test');
      expect(result).toBeNull();
    });

    it('crée une notification si permission accordée', () => {
      const mockNotification = { close: vi.fn() };
      global.Notification = vi.fn(() => mockNotification);
      global.Notification.permission = 'granted';

      const result = showNotification('Test', { body: 'Test body' });
      
      expect(global.Notification).toHaveBeenCalledWith('Test', expect.objectContaining({
        body: 'Test body',
      }));
      expect(result).toBe(mockNotification);
    });

    it('gère les erreurs de création', () => {
      global.Notification = vi.fn(() => {
        throw new Error('test');
      });
      global.Notification.permission = 'granted';

      const result = showNotification('Test');
      expect(result).toBeNull();
    });
  });

  describe('playNotificationSound', () => {
    it('tente de jouer le son sans crasher', () => {
      // Dans JSDOM, play() n'est pas implémenté, mais on peut vérifier que la fonction gère les erreurs
      // Le test passe si la fonction ne crash pas (les erreurs sont catch)
      playNotificationSound();
      // Pas de vérification stricte car HTMLMediaElement n'est pas supporté
      expect(true).toBe(true);
    });
  });

  describe('saveNotificationPreferences', () => {
    it('sauvegarde les préférences dans localStorage', () => {
      const setItem = vi.fn();
      global.localStorage = { setItem };

      saveNotificationPreferences(true);
      expect(setItem).toHaveBeenCalledWith('notifications-enabled', 'true');
    });

    it('gère les erreurs localStorage', () => {
      const setItem = vi.fn(() => {
        throw new Error('test');
      });
      global.localStorage = { setItem };

      expect(() => saveNotificationPreferences(true)).not.toThrow();
    });
  });

  describe('loadNotificationPreferences', () => {
    it('charge les préférences depuis localStorage', () => {
      const getItem = vi.fn().mockReturnValue('false');
      global.localStorage = { getItem };

      const result = loadNotificationPreferences();
      expect(getItem).toHaveBeenCalledWith('notifications-enabled');
      expect(result).toBe(false);
    });

    it('retourne true par défaut', () => {
      const getItem = vi.fn().mockReturnValue(null);
      global.localStorage = { getItem };

      const result = loadNotificationPreferences();
      expect(result).toBe(true);
    });

    it('gère les erreurs localStorage', () => {
      const getItem = vi.fn(() => {
        throw new Error('test');
      });
      global.localStorage = { getItem };

      const result = loadNotificationPreferences();
      expect(result).toBe(true);
    });
  });

  describe('TitleBadge', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Réinitialiser le badge et le titre
      titleBadge.reset();
      titleBadge.updateOriginal('Test App');
    });

    afterEach(() => {
      titleBadge.reset();
      vi.useRealTimers();
    });

    it('définit un badge clignotant', () => {
      titleBadge.set('✅', 'Done');
      
      // Le badge alterne entre le badge et le titre original
      vi.advanceTimersByTime(500); // Attendre un peu
      const firstTitle = document.title;
      expect(['✅ Done', 'Test App']).toContain(firstTitle);
      
      vi.advanceTimersByTime(1000);
      const secondTitle = document.title;
      expect(secondTitle).not.toBe(firstTitle); // Le titre a changé
    });

    it('définit un badge permanent', () => {
      titleBadge.setPermanent('(50%)', 'Converting');
      expect(document.title).toBe('(50%) Converting');
      
      // Ne change pas avec le temps
      vi.advanceTimersByTime(2000);
      expect(document.title).toBe('(50%) Converting');
    });

    it('réinitialise le titre', () => {
      titleBadge.setPermanent('✅', 'Done');
      expect(document.title).toBe('✅ Done');
      
      titleBadge.reset();
      expect(document.title).toBe('Test App');
    });

    it('met à jour le titre original', () => {
      titleBadge.updateOriginal('New App Title');
      expect(document.title).toBe('New App Title');
    });

    it('arrête l\'animation au reset', () => {
      titleBadge.set('✅', 'Done');
      vi.advanceTimersByTime(1000);
      
      titleBadge.reset();
      const titleAfterReset = document.title;
      
      // Vérifier que le titre ne change plus
      vi.advanceTimersByTime(5000);
      expect(document.title).toBe(titleAfterReset);
    });
  });
});

