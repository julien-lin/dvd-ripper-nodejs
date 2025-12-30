import { useState, useEffect } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  saveNotificationPreferences,
  loadNotificationPreferences,
} from '../services/notificationService';

const NotificationSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Charger les préférences sauvegardées
    const savedEnabled = loadNotificationPreferences();
    setEnabled(savedEnabled);
    
    // Vérifier la permission actuelle
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleToggle = async () => {
    if (!enabled) {
      // Activer : demander la permission
      const perm = await requestNotificationPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
        setEnabled(true);
        saveNotificationPreferences(true);
      }
    } else {
      // Désactiver
      setEnabled(false);
      saveNotificationPreferences(false);
    }
  };

  if (!isNotificationSupported()) {
    return null; // Ne rien afficher si non supporté
  }

  return (
    <div className="relative">
      {/* Bouton icône */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors relative"
        title="Paramètres de notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {enabled && permission === 'granted' && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span>🔔</span>
                Notifications
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-gray-100">Activer les notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des alertes de fin de conversion
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled && permission === 'granted' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled && permission === 'granted' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* État de la permission */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">État</div>
                {permission === 'granted' && enabled && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Notifications activées
                  </div>
                )}
                {permission === 'denied' && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <div className="font-medium mb-1">Permission refusée</div>
                    <div className="text-xs">
                      Activez les notifications dans les paramètres de votre navigateur
                    </div>
                  </div>
                )}
                {permission === 'default' && !enabled && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 p-2 rounded">
                    Cliquez sur le bouton ci-dessus pour activer
                  </div>
                )}
              </div>

              {/* Fonctionnalités */}
              {enabled && permission === 'granted' && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fonctionnalités</div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Notification de fin de conversion
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Son de notification
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Badge sur l'onglet
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Alertes d'erreur
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSettings;

