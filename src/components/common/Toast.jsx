/**
 * Composant Toast pour afficher des notifications
 * Remplace les alert() par un système moderne et élégant
 */

import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Styles par type
  const styles = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600',
  };

  // Icônes par type
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${styles[type]} text-white px-6 py-4 rounded-lg shadow-2xl border-l-4 animate-fade-in max-w-md`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white bg-opacity-20 rounded-full text-lg font-bold">
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors text-xl font-bold leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;

