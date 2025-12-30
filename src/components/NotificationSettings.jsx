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
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
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
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span>🔔</span>
                Notifications
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Toggle Switch - Professionnel */}
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 pr-4">
                  <label htmlFor="notification-toggle" className="flex flex-col cursor-pointer">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-2">
                      Activer les notifications
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Recevoir des alertes lors de la fin des conversions
                    </span>
                  </label>
                </div>

                {/* Bouton Switch */}
                <button
                  id="notification-toggle"
                  type="button"
                  onClick={handleToggle}
                  role="switch"
                  aria-checked={enabled && permission === 'granted'}
                  aria-label={enabled ? "Désactiver les notifications" : "Activer les notifications"}
                  disabled={permission === 'denied'}
                  className={`
                    relative inline-flex h-10 w-20 flex-shrink-0 rounded-full
                    border-2 border-transparent transition-all duration-300 ease-in-out
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    dark:focus-visible:ring-offset-gray-800
                    ${enabled && permission === 'granted'
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 focus-visible:ring-emerald-400'
                      : permission === 'denied'
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-400 focus-visible:ring-gray-400'
                    }
                  `}
                >
                  <span className="sr-only">
                    {enabled ? 'Désactiver' : 'Activer'} les notifications
                  </span>

                  {/* Thumb du switch */}
                  <span
                    aria-hidden="true"
                    className={`
                      absolute h-8 w-8 rounded-full bg-white shadow-md
                      flex items-center justify-center
                      transition-transform duration-300 ease-in-out
                      left-1 top-1
                      ${enabled && permission === 'granted'
                        ? 'translate-x-10'
                        : 'translate-x-0'
                      }
                    `}
                  >
                    {/* Icône animée */}
                    <svg
                      className={`h-4 w-4 transition-opacity duration-300 ease-in-out
                        ${enabled && permission === 'granted'
                          ? 'opacity-100 text-emerald-500'
                          : 'opacity-0 text-gray-400'
                        }
                      `}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* État du système - Onglet informatif */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  État du système
                </h4>

                {permission === 'granted' && enabled && (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-100">Activé</div>
                      <div className="text-xs text-emerald-800 dark:text-emerald-200 mt-0.5">Les notifications sont maintenant actives. Vous recevrez des alertes lors de la fin des conversions.</div>
                    </div>
                  </div>
                )}

                {permission === 'denied' && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-red-900 dark:text-red-100">Permission refusée</div>
                      <div className="text-xs text-red-800 dark:text-red-200 mt-0.5">Vous avez refusé l'accès. Allez dans les paramètres de votre navigateur pour modifier cette permission.</div>
                    </div>
                  </div>
                )}

                {permission === 'default' && !enabled && (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900 dark:text-amber-100">Inactif</div>
                      <div className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">Activez les notifications en cliquant sur le commutateur ci-dessus.</div>
                    </div>
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

